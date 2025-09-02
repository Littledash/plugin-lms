import { addDataAndFileToRequest, CollectionSlug, type Endpoint } from 'payload'

type Args = {
  userSlug: string
  quizzesSlug: string
}

type SubmitQuizHandler = (args: Args) => Endpoint['handler']

export const submitQuizHandler: SubmitQuizHandler = ({ userSlug = 'users', quizzesSlug = 'quizzes' }) => async (req) => {
  await addDataAndFileToRequest(req)
  const data = req.data
  const user = req.user
  const payload = req.payload
  const courseId = data?.courseId
  const quizId = data?.quizId
  const answers = data?.answers

  if (!user) {
    return Response.json({ message: 'You must be logged in to submit a quiz.' }, { status: 401 })
  }

  if (!courseId || !quizId || !answers) {
    return Response.json(
      { message: 'Course ID, Quiz ID, and answers are required.' },
      { status: 400 },
    )
  }

  try {
    const quiz = await payload.findByID({
      collection: quizzesSlug as CollectionSlug,
      id: quizId,
      depth: 2, // Eager load questions and their answers
    })

    if (!quiz) {
      return Response.json({ message: 'Quiz not found.' }, { status: 404 })
    }

    // Basic grading logic
    let correctAnswers = 0
    if (quiz.questions && Array.isArray(quiz.questions)) {
      for (const question of quiz.questions) {
        if (
          question &&
          typeof question === 'object' &&
          'answers' in question &&
          Array.isArray(question.answers)
        ) {
          const submittedAnswer = answers[question.id]
          const correctAnswer = question.answers.find((a: any) => a.isCorrect)?.id
          if (submittedAnswer === correctAnswer) {
            correctAnswers++
          }
        }
      }
    }
    const score = quiz.questions.length > 0 ? (correctAnswers / quiz.questions.length) * 100 : 0

    const currentUser = await payload.findByID({
      collection: userSlug as CollectionSlug,
      id: user.id,
    })

    if (!currentUser) {
      return Response.json({ message: 'User not found.' }, { status: 404 })
    }

    const coursesProgress = currentUser.coursesProgress || []
    let courseProgressIndex = coursesProgress.findIndex((cp: any) => cp.course === courseId)
    
    if (courseProgressIndex === -1) {
      // Create new course progress entry
      coursesProgress.push({
        course: courseId,
        completed: false,
        completedLessons: [],
        completedQuizzes: [],
      })
      courseProgressIndex = coursesProgress.length - 1
    }
    
    const courseProgress = coursesProgress[courseProgressIndex]
    const quizExists = courseProgress.completedQuizzes.some((cq: any) => cq.quiz === quizId)
    
    if (!quizExists) {
      courseProgress.completedQuizzes.push({
        quiz: quizId,
        score: score,
        completedAt: new Date().toISOString(),
      })
    } else {
      // Update existing quiz score
      const quizIndex = courseProgress.completedQuizzes.findIndex((cq: any) => cq.quiz === quizId)
      if (quizIndex !== -1) {
        courseProgress.completedQuizzes[quizIndex].score = score
        courseProgress.completedQuizzes[quizIndex].completedAt = new Date().toISOString()
      }
    }

    await payload.update({
      collection: userSlug as CollectionSlug,
      id: user.id,
      data: {
        coursesProgress,
      },
    })

    payload.logger.info(
      `User ${user.id} submitted quiz ${quizId} in course ${courseId} and scored ${score}`,
    )

    return Response.json({ success: true, score })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.'
    payload.logger.error(message)
    return Response.json({ message }, { status: 500 })
  }
}
