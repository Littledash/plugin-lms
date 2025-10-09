/**
 * Checks if a lesson has any quizzes associated with it
 * @param lesson - The lesson object to check
 * @returns boolean indicating if the lesson has quizzes
 */ export const lessonHasQuizzes = (lesson)=>{
    return Boolean(lesson.quizzes && Array.isArray(lesson.quizzes) && lesson.quizzes.length > 0);
};
/**
 * Checks if all quizzes for a lesson are completed
 * @param courseProgress - The course progress object
 * @param lesson - The lesson object to check
 * @returns boolean indicating if all quizzes are completed
 */ export const allQuizzesCompleted = (courseProgress, lesson)=>{
    if (!lessonHasQuizzes(lesson)) {
        return true // No quizzes means "all quizzes completed"
        ;
    }
    const lessonQuizIds = lesson.quizzes.map((quiz)=>typeof quiz === 'object' ? quiz.id : quiz);
    return lessonQuizIds.every((quizId)=>courseProgress.completedQuizzes.some((cq)=>typeof cq.quiz === 'object' ? cq.quiz.id === quizId : cq.quiz === quizId));
};
/**
 * Checks if a lesson is completed, including both lesson completion and quiz completion
 * @param progress - The user's progress across all courses
 * @param courseId - The ID of the course
 * @param lessonId - The ID of the lesson
 * @param lesson - Optional lesson object (if not provided, only checks lesson completion)
 * @returns object with completion status details
 */ export const completedLesson = (progress, courseId, lessonId, lesson)=>{
    const courseProgress = progress.find((p)=>(typeof p.course === 'object' ? p.course.id : p.course) === courseId);
    if (!courseProgress) {
        return {
            isCompleted: false,
            hasQuizzes: false,
            allQuizzesCompleted: false,
            lessonCompleted: false
        };
    }
    const lessonCompleted = Boolean(courseProgress.completedLessons.find((l)=>typeof l.lesson === 'object' ? l.lesson.id : l.lesson === lessonId));
    // If no lesson object provided, return basic completion status
    if (!lesson) {
        return {
            isCompleted: lessonCompleted,
            hasQuizzes: false,
            allQuizzesCompleted: false,
            lessonCompleted
        };
    }
    const hasQuizzes = lessonHasQuizzes(lesson);
    const allQuizzesCompletedForLesson = allQuizzesCompleted(courseProgress, lesson);
    // A lesson is fully completed if:
    // 1. The lesson itself is marked as completed, AND
    // 2. Either there are no quizzes, OR all quizzes are completed
    const isCompleted = lessonCompleted && (!hasQuizzes || allQuizzesCompletedForLesson);
    return {
        isCompleted,
        hasQuizzes,
        allQuizzesCompleted: allQuizzesCompletedForLesson,
        lessonCompleted
    };
};

//# sourceMappingURL=completedLesson.js.map