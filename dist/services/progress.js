import { markCourseCompleted } from './completeCourse.js';
import { assertLessonAccessible, lessonBlockReason } from './lessonAccess.js';
import { asSlug, ensureCourseProgress, findDoc, getCourseLessonIds, getCoursesProgress, getSlugs, hasCompletedRequiredLessons, includesId, isEnrolledInCourse, LMSError, sameId, toId, toIds, withTransaction } from './shared.js';
const DEFAULT_MINIMUM_SCORE = 100;
/**
 * Whether the user has a passing score on every one of these quizzes.
 */ const hasPassedQuizzes = async (req, quizIds, progress)=>{
    if (quizIds.length === 0) {
        return true;
    }
    const { docs: quizzes } = await req.payload.find({
        collection: asSlug(getSlugs(req).quizzes),
        depth: 0,
        limit: quizIds.length,
        pagination: false,
        req,
        where: {
            id: {
                in: quizIds
            }
        }
    });
    return quizzes.every((quiz)=>progress.completedQuizzes.some((entry)=>sameId(entry.quiz, quiz.id) && entry.score >= (quiz.minimumScore ?? DEFAULT_MINIMUM_SCORE)));
};
const addCompletedLesson = (progress, lessonId)=>{
    if (progress.completedLessons.some((entry)=>sameId(entry.lesson, lessonId))) {
        return false;
    }
    progress.completedLessons.push({
        completedAt: new Date().toISOString(),
        lesson: lessonId
    });
    return true;
};
/**
 * Records a completed lesson. The lesson must belong to the course, the user must be enrolled,
 * and every quiz on the lesson must already be passed. Completing the last required lesson
 * completes the course.
 */ export const completeLesson = ({ courseId, lessonId, req, userId })=>withTransaction(req, async ()=>{
        const slugs = getSlugs(req);
        const user = await findDoc(req, slugs.students, userId, 'User');
        const course = await findDoc(req, slugs.courses, courseId, 'Course');
        if (!includesId(getCourseLessonIds(course), lessonId)) {
            throw new LMSError('This lesson is not part of the course.', 400);
        }
        if (!await isEnrolledInCourse(req, course, user.id)) {
            throw new LMSError('You are not enrolled in this course.', 403);
        }
        const lesson = await findDoc(req, slugs.lessons, lessonId, 'Lesson');
        const coursesProgress = getCoursesProgress(user);
        const progress = ensureCourseProgress(coursesProgress, course.id);
        assertLessonAccessible({
            course,
            lesson,
            lessonId: lesson.id,
            progress
        });
        if (!await hasPassedQuizzes(req, toIds(lesson.quizzes), progress)) {
            throw new LMSError("Pass all of this lesson's quizzes first.", 409);
        }
        addCompletedLesson(progress, lesson.id);
        let userData = {
            coursesProgress
        };
        let courseCompleted = false;
        if (!progress.completed && hasCompletedRequiredLessons(course, progress)) {
            ;
            ({ userData } = await markCourseCompleted({
                course,
                coursesProgress,
                req,
                user
            }));
            courseCompleted = true;
        }
        await req.payload.update({
            id: user.id,
            collection: asSlug(slugs.students),
            data: userData,
            req
        });
        req.payload.logger.info(`User ${user.id} completed lesson ${lesson.id} in course ${course.id}`);
        return {
            courseCompleted
        };
    });
const DEFAULT_ATTEMPT_COOLDOWN_SECONDS = 5;
const assertCanAttempt = (req, quiz, attempt)=>{
    if (!attempt) {
        return;
    }
    const attempts = attempt.attempts ?? 1;
    if (quiz.attemptLimit && attempts >= quiz.attemptLimit) {
        throw new LMSError(`You have used all ${quiz.attemptLimit} attempts for this quiz.`, 429);
    }
    const cooldownSeconds = req.payload.config.custom?.lms?.quizAttemptCooldownSeconds ?? DEFAULT_ATTEMPT_COOLDOWN_SECONDS;
    const lastAttemptAt = Date.parse(attempt.lastAttemptAt || attempt.completedAt);
    const waitSeconds = Math.ceil(cooldownSeconds - (Date.now() - lastAttemptAt) / 1000);
    if (cooldownSeconds > 0 && waitSeconds > 0) {
        throw new LMSError(`Please wait ${waitSeconds} seconds before trying this quiz again.`, 429);
    }
};
const isCorrectAnswer = (question, submittedAnswer)=>{
    if (question.questionType === 'trueFalse') {
        // 'both' accepts either answer
        return question.correctAnswer === 'both' ? submittedAnswer === 'true' || submittedAnswer === 'false' : submittedAnswer === question.correctAnswer;
    }
    if (question.questionType === 'multipleChoice' || question.questionType === 'singleChoice') {
        const correctChoice = (Array.isArray(question.choices) ? question.choices : []).find((choice)=>choice.isCorrect);
        return Boolean(correctChoice) && submittedAnswer === correctChoice.id;
    }
    return false;
};
/**
 * Grades a quiz attempt and keeps the user's best score. The quiz must belong to a lesson in the
 * course and the user must be enrolled. A pass completes every lesson in the course that contains
 * the quiz once all of that lesson's quizzes are passed, and the course if that was the last
 * required lesson.
 */ export const submitQuiz = ({ answers, courseId, quizId, req, userId })=>withTransaction(req, async ()=>{
        const slugs = getSlugs(req);
        const user = await findDoc(req, slugs.students, userId, 'User');
        const course = await findDoc(req, slugs.courses, courseId, 'Course');
        if (!await isEnrolledInCourse(req, course, user.id)) {
            throw new LMSError('You are not enrolled in this course.', 403);
        }
        const { docs: quizLessons } = await req.payload.find({
            collection: asSlug(slugs.lessons),
            depth: 0,
            pagination: false,
            req,
            where: {
                and: [
                    {
                        id: {
                            in: getCourseLessonIds(course)
                        }
                    },
                    {
                        quizzes: {
                            in: [
                                quizId
                            ]
                        }
                    }
                ]
            }
        });
        if (quizLessons.length === 0) {
            throw new LMSError('This quiz is not part of the course.', 400);
        }
        // depth 1 populates the questions, including the answer fields hidden from students
        const quiz = await req.payload.findByID({
            id: quizId,
            collection: asSlug(slugs.quizzes),
            depth: 1,
            disableErrors: true,
            req
        });
        if (!quiz) {
            throw new LMSError('Quiz not found.', 404);
        }
        const coursesProgress = getCoursesProgress(user);
        const progress = ensureCourseProgress(coursesProgress, course.id);
        const openLessons = quizLessons.filter((lesson)=>lessonBlockReason({
                course,
                lesson,
                lessonId: lesson.id,
                progress
            }) === null);
        if (openLessons.length === 0) {
            const lesson = quizLessons[0];
            assertLessonAccessible({
                course,
                lesson,
                lessonId: lesson.id,
                progress
            });
        }
        const attempt = progress.completedQuizzes.find((entry)=>sameId(entry.quiz, quiz.id));
        // Checked before grading so a rejected attempt reveals nothing about the answers
        assertCanAttempt(req, quiz, attempt);
        const questions = (Array.isArray(quiz.questions) ? quiz.questions : []).filter((question)=>question && typeof question === 'object');
        const correctAnswers = questions.filter((question)=>isCorrectAnswer(question, answers[String(question.id)])).length;
        const score = questions.length > 0 ? correctAnswers / questions.length * 100 : 0;
        const minimumScore = quiz.minimumScore ?? DEFAULT_MINIMUM_SCORE;
        const now = new Date().toISOString();
        if (!attempt) {
            progress.completedQuizzes.push({
                attempts: 1,
                completedAt: now,
                lastAttemptAt: now,
                quiz: quiz.id,
                score
            });
        } else {
            attempt.attempts = (attempt.attempts ?? 1) + 1;
            attempt.lastAttemptAt = now;
            if (score > attempt.score) {
                // Only an improved score replaces the previous attempt
                attempt.score = score;
                attempt.completedAt = now;
            }
        }
        const passed = score >= minimumScore;
        const completedLessonIds = [];
        let userData = {
            coursesProgress
        };
        let courseCompleted = false;
        if (passed) {
            for (const lesson of openLessons){
                if (await hasPassedQuizzes(req, toIds(lesson.quizzes), progress) && addCompletedLesson(progress, lesson.id)) {
                    completedLessonIds.push(lesson.id);
                }
            }
            if (!progress.completed && hasCompletedRequiredLessons(course, progress)) {
                ;
                ({ userData } = await markCourseCompleted({
                    course,
                    coursesProgress,
                    req,
                    user
                }));
                courseCompleted = true;
            }
        }
        await req.payload.update({
            id: user.id,
            collection: asSlug(slugs.students),
            data: userData,
            req
        });
        req.payload.logger.info(`User ${user.id} submitted quiz ${quiz.id} in course ${course.id} and scored ${score}`);
        return {
            completedLessonIds,
            courseCompleted,
            minimumScore,
            passed,
            score
        };
    });
/**
 * Returns the user's progress with a completion percentage per course.
 */ export const getProgress = async ({ req, userId })=>{
    const slugs = getSlugs(req);
    const user = await findDoc(req, slugs.students, userId, 'User');
    const coursesProgress = getCoursesProgress(user);
    const findCourses = async (where)=>(await req.payload.find({
            collection: asSlug(slugs.courses),
            depth: 0,
            pagination: false,
            req,
            where
        })).docs;
    const [progressCourses, enrolledCourses, completedCourses] = await Promise.all([
        coursesProgress.length > 0 ? findCourses({
            id: {
                in: coursesProgress.map((progress)=>progress.course)
            }
        }) : Promise.resolve([]),
        findCourses({
            enrolledStudents: {
                in: [
                    user.id
                ]
            }
        }),
        findCourses({
            courseCompletedStudents: {
                in: [
                    user.id
                ]
            }
        })
    ]);
    return {
        completedCourses: completedCourses.map((course)=>toId(course)),
        coursesProgress: coursesProgress.map((progress)=>{
            const course = progressCourses.find((doc)=>sameId(doc.id, progress.course));
            const requiredLessonIds = course ? getCourseLessonIds(course, {
                requiredOnly: true
            }) : [];
            const completedCount = progress.completedLessons.filter((entry)=>includesId(requiredLessonIds, entry.lesson)).length;
            const total = requiredLessonIds.length;
            return {
                ...progress,
                completionPercentage: total > 0 ? Math.round(completedCount / total * 100) : 0,
                courseCompletion: total > 0 ? `${completedCount}/${total}` : ''
            };
        }),
        enrolledCourses: enrolledCourses.map((course)=>toId(course))
    };
};

//# sourceMappingURL=progress.js.map