import type { PayloadRequest } from 'payload'

import { markCourseCompleted } from './completeCourse.js'
import {
  asSlug,
  ensureCourseProgress,
  findDoc,
  getCourseLessonIds,
  getCoursesProgress,
  getSlugs,
  hasCompletedRequiredLessons,
  type ID,
  includesId,
  isEnrolledInCourse,
  type LMSDoc,
  LMSError,
  sameId,
  toId,
  toIds,
  withTransaction,
} from './shared.js'

const DEFAULT_MINIMUM_SCORE = 100

type CompleteLessonArgs = {
  courseId: ID
  lessonId: ID
  req: PayloadRequest
  userId: ID
}

export type CompleteLessonResult = {
  courseCompleted: boolean
}

/**
 * Records a completed lesson. The lesson must belong to the course, the user must be enrolled,
 * and every quiz on the lesson must already be passed. Completing the last required lesson
 * completes the course.
 */
export const completeLesson = ({
  courseId,
  lessonId,
  req,
  userId,
}: CompleteLessonArgs): Promise<CompleteLessonResult> =>
  withTransaction(req, async () => {
    const slugs = getSlugs(req)
    const user = await findDoc(req, slugs.students, userId, 'User')
    const course = await findDoc(req, slugs.courses, courseId, 'Course')

    if (!includesId(getCourseLessonIds(course), lessonId)) {
      throw new LMSError('This lesson is not part of the course.', 400)
    }
    if (!(await isEnrolledInCourse(req, course, user.id))) {
      throw new LMSError('You are not enrolled in this course.', 403)
    }

    const lesson = await findDoc(req, slugs.lessons, lessonId, 'Lesson')
    const coursesProgress = getCoursesProgress(user)
    const progress = ensureCourseProgress(coursesProgress, course.id)

    const quizIds = toIds(lesson.quizzes)
    if (quizIds.length > 0) {
      const { docs: quizzes } = await req.payload.find({
        collection: asSlug(slugs.quizzes),
        depth: 0,
        limit: quizIds.length,
        pagination: false,
        req,
        where: { id: { in: quizIds } },
      })
      const unpassed = (quizzes as LMSDoc[]).filter(
        (quiz) =>
          !progress.completedQuizzes.some(
            (entry) =>
              sameId(entry.quiz, quiz.id) &&
              entry.score >= (quiz.minimumScore ?? DEFAULT_MINIMUM_SCORE),
          ),
      )
      if (unpassed.length > 0) {
        throw new LMSError("Pass all of this lesson's quizzes first.", 409)
      }
    }

    if (!progress.completedLessons.some((entry) => sameId(entry.lesson, lesson.id))) {
      progress.completedLessons.push({ completedAt: new Date().toISOString(), lesson: lesson.id })
    }

    let userData: Record<string, unknown> = { coursesProgress }
    let courseCompleted = false

    if (!progress.completed && hasCompletedRequiredLessons(course, progress)) {
      ;({ userData } = await markCourseCompleted({ course, coursesProgress, req, user }))
      courseCompleted = true
    }

    await req.payload.update({
      id: user.id,
      collection: asSlug(slugs.students),
      data: userData,
      req,
    })

    req.payload.logger.info(`User ${user.id} completed lesson ${lesson.id} in course ${course.id}`)
    return { courseCompleted }
  })

type SubmitQuizArgs = {
  answers: Record<string, unknown>
  courseId: ID
  quizId: ID
  req: PayloadRequest
  userId: ID
}

export type SubmitQuizResult = {
  minimumScore: number
  passed: boolean
  score: number
}

const isCorrectAnswer = (question: LMSDoc, submittedAnswer: unknown): boolean => {
  if (question.questionType === 'trueFalse') {
    // 'both' accepts either answer
    return question.correctAnswer === 'both'
      ? submittedAnswer === 'true' || submittedAnswer === 'false'
      : submittedAnswer === question.correctAnswer
  }
  if (question.questionType === 'multipleChoice' || question.questionType === 'singleChoice') {
    const correctChoice = (Array.isArray(question.choices) ? question.choices : []).find(
      (choice: LMSDoc) => choice.isCorrect,
    )
    return Boolean(correctChoice) && submittedAnswer === correctChoice.id
  }
  return false
}

/**
 * Grades a quiz attempt and keeps the user's best score. The quiz must belong to a lesson in the
 * course and the user must be enrolled.
 */
export const submitQuiz = ({
  answers,
  courseId,
  quizId,
  req,
  userId,
}: SubmitQuizArgs): Promise<SubmitQuizResult> =>
  withTransaction(req, async () => {
    const slugs = getSlugs(req)
    const user = await findDoc(req, slugs.students, userId, 'User')
    const course = await findDoc(req, slugs.courses, courseId, 'Course')

    if (!(await isEnrolledInCourse(req, course, user.id))) {
      throw new LMSError('You are not enrolled in this course.', 403)
    }

    const { totalDocs } = await req.payload.count({
      collection: asSlug(slugs.lessons),
      req,
      where: {
        and: [{ id: { in: getCourseLessonIds(course) } }, { quizzes: { in: [quizId] } }],
      },
    })
    if (totalDocs === 0) {
      throw new LMSError('This quiz is not part of the course.', 400)
    }

    // depth 1 populates the questions, including the answer fields hidden from students
    const quiz = (await req.payload.findByID({
      id: quizId,
      collection: asSlug(slugs.quizzes),
      depth: 1,
      disableErrors: true,
      req,
    })) as LMSDoc | null
    if (!quiz) {
      throw new LMSError('Quiz not found.', 404)
    }

    const questions = (Array.isArray(quiz.questions) ? quiz.questions : []).filter(
      (question: unknown) => question && typeof question === 'object',
    ) as LMSDoc[]
    const correctAnswers = questions.filter((question) =>
      isCorrectAnswer(question, answers[String(question.id)]),
    ).length
    const score = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0
    const minimumScore = quiz.minimumScore ?? DEFAULT_MINIMUM_SCORE

    const coursesProgress = getCoursesProgress(user)
    const progress = ensureCourseProgress(coursesProgress, course.id)
    const now = new Date().toISOString()
    const attempt = progress.completedQuizzes.find((entry) => sameId(entry.quiz, quiz.id))

    if (!attempt) {
      progress.completedQuizzes.push({ completedAt: now, quiz: quiz.id, score })
    } else if (score > attempt.score) {
      // Only an improved score replaces the previous attempt
      attempt.score = score
      attempt.completedAt = now
    }

    await req.payload.update({
      id: user.id,
      collection: asSlug(slugs.students),
      data: { coursesProgress },
      req,
    })

    req.payload.logger.info(
      `User ${user.id} submitted quiz ${quiz.id} in course ${course.id} and scored ${score}`,
    )
    return { minimumScore, passed: score >= minimumScore, score }
  })

export type ProgressResult = {
  completedCourses: ID[]
  coursesProgress: ({
    completionPercentage: number
    courseCompletion: string
  } & ReturnType<typeof getCoursesProgress>[number])[]
  enrolledCourses: ID[]
}

/**
 * Returns the user's progress with a completion percentage per course.
 */
export const getProgress = async ({
  req,
  userId,
}: {
  req: PayloadRequest
  userId: ID
}): Promise<ProgressResult> => {
  const slugs = getSlugs(req)
  const user = await findDoc(req, slugs.students, userId, 'User')
  const coursesProgress = getCoursesProgress(user)

  const findCourses = async (where: Parameters<typeof req.payload.find>[0]['where']) =>
    (
      await req.payload.find({
        collection: asSlug(slugs.courses),
        depth: 0,
        pagination: false,
        req,
        where,
      })
    ).docs as LMSDoc[]

  const [progressCourses, enrolledCourses, completedCourses] = await Promise.all([
    coursesProgress.length > 0
      ? findCourses({ id: { in: coursesProgress.map((progress) => progress.course) } })
      : Promise.resolve([]),
    findCourses({ enrolledStudents: { in: [user.id] } }),
    findCourses({ courseCompletedStudents: { in: [user.id] } }),
  ])

  return {
    completedCourses: completedCourses.map((course) => toId(course) as ID),
    coursesProgress: coursesProgress.map((progress) => {
      const course = progressCourses.find((doc) => sameId(doc.id, progress.course))
      const requiredLessonIds = course ? getCourseLessonIds(course, { requiredOnly: true }) : []
      const completedCount = progress.completedLessons.filter((entry) =>
        includesId(requiredLessonIds, entry.lesson),
      ).length
      const total = requiredLessonIds.length
      return {
        ...progress,
        completionPercentage: total > 0 ? Math.round((completedCount / total) * 100) : 0,
        courseCompletion: total > 0 ? `${completedCount}/${total}` : '',
      }
    }),
    enrolledCourses: enrolledCourses.map((course) => toId(course) as ID),
  }
}
