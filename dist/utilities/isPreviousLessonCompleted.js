export const isPreviousLessonCompleted = (progress, course, lessonId)=>{
    const lessonIndex = course.lessons?.findIndex((l)=>typeof l.lesson !== 'string' && l.lesson.id === lessonId);
    const previousLesson = lessonIndex !== undefined && lessonIndex > 0 ? course.lessons?.[lessonIndex - 1] : undefined;
    if (!previousLesson) return true // If there is no previous lesson, then the previous lesson is completed
    ;
    const previousLessonId = typeof previousLesson.lesson === 'object' ? previousLesson.lesson.id : previousLesson.lesson;
    return progress.find((p)=>(typeof p.course === 'object' ? p.course.id : p.course) === course.id)?.completedLessons.find((l)=>(typeof l.lesson === 'object' ? l.lesson.id : l.lesson) === previousLessonId) || false;
};

//# sourceMappingURL=isPreviousLessonCompleted.js.map