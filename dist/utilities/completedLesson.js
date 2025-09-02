export const completedLesson = (progress, courseId, lessonId)=>{
    return progress.find((p)=>(typeof p.course === 'object' ? p.course.id : p.course) === courseId)?.completedLessons.find((l)=>typeof l.lesson === 'object' ? l.lesson.id : l.lesson === lessonId) || false;
};

//# sourceMappingURL=completedLesson.js.map