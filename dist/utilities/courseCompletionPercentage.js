export const courseCompletionPercentage = (progress, courseId)=>{
    const courseProgress = progress.find((p)=>(typeof p.course === 'object' ? p.course.id : p.course) === courseId);
    if (!courseProgress) {
        return 0;
    }
    return courseProgress.completionPercentage || 0;
};

//# sourceMappingURL=courseCompletionPercentage.js.map