import { completedLesson } from './completedLesson.js';
const relationId = (value)=>{
    if (value == null) {
        return undefined;
    }
    const id = typeof value === 'object' ? value.id : value;
    if (typeof id === 'string' || typeof id === 'number') {
        return String(id);
    }
    return undefined;
};
export const isPreviousLessonCompleted = (progress, course, lessonId)=>{
    const lessons = course.lessons ?? [];
    const lessonIndex = lessons.findIndex((entry)=>relationId(entry?.lesson) === String(lessonId));
    // The first lesson, or a lesson that is not in this course, has no previous lesson to finish.
    if (lessonIndex <= 0) {
        return true;
    }
    const previous = lessons[lessonIndex - 1];
    const previousId = relationId(previous?.lesson);
    if (!previousId) {
        return true;
    }
    const previousLesson = typeof previous.lesson === 'object' && previous.lesson !== null ? previous.lesson : null;
    // A populated lesson includes its quizzes, so completion has to include those too.
    if (previousLesson && 'quizzes' in previousLesson) {
        return completedLesson(progress, String(course.id), previousLesson).isCompleted;
    }
    const courseProgress = progress.find((entry)=>relationId(entry.course) === String(course.id));
    if (!courseProgress) {
        return false;
    }
    return courseProgress.completedLessons.some((entry)=>relationId(entry.lesson) === previousId);
};

//# sourceMappingURL=isPreviousLessonCompleted.js.map