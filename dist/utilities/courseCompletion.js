export const courseCompletion = (progress, courseId)=>{
    const courseProgress = progress.find((p)=>(typeof p.course === 'object' ? p.course.id : p.course) === courseId);
    if (!courseProgress) {
        return '';
    }
    return courseProgress.courseCompletion || '';
};

//# sourceMappingURL=courseCompletion.js.map