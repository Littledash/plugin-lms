export const completedLesson = (progress, courseId, lessonId)=>{
    const courseProgress = progress.find((p)=>(typeof p.course === 'object' ? p.course.id : p.course) === courseId);
    if (!courseProgress) {
        return false;
    }
    return Boolean(courseProgress.completedLessons.find((l)=>typeof l.lesson === 'object' ? l.lesson.id : l.lesson === lessonId));
};

//# sourceMappingURL=completedLesson.js.map