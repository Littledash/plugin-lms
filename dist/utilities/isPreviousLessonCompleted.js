import { completedLesson } from "./completedLesson.js";
export const isPreviousLessonCompleted = (progress, course, lessonId)=>{
    const lessonIndex = course.lessons?.findIndex((l)=>typeof l.lesson === 'object' && l.lesson !== null && l.lesson.id === lessonId);
    const previousLesson = lessonIndex !== undefined && lessonIndex > 0 ? course.lessons?.[lessonIndex - 1] : undefined;
    if (!previousLesson) return true // If there is no previous lesson, then the previous lesson is completed
    ;
    // Get the previous lesson object - it could be a full lesson object or just an ID
    const previousLessonObj = typeof previousLesson.lesson === 'object' && previousLesson.lesson !== null ? previousLesson.lesson : null;
    // If we have a full lesson object (with id property), use completedLesson to check completion including quizzes
    if (previousLessonObj && 'id' in previousLessonObj) {
        const completionStatus = completedLesson(progress, String(course.id), previousLessonObj);
        return completionStatus.isCompleted;
    }
    // Fallback: if we only have an ID, check basic lesson completion (without quiz check)
    // This handles cases where the course wasn't fetched with depth
    const previousLessonId = typeof previousLesson.lesson === 'object' && previousLesson.lesson !== null ? previousLesson.lesson.id : previousLesson.lesson;
    const courseProgress = progress.find((p)=>(typeof p.course === 'object' ? p.course.id : p.course) === course.id);
    if (!courseProgress) {
        return false;
    }
    return courseProgress.completedLessons.find((l)=>(typeof l.lesson === 'object' ? l.lesson.id : l.lesson) === previousLessonId) !== undefined;
};

//# sourceMappingURL=isPreviousLessonCompleted.js.map