import { CourseProgress, Progress } from '../providers/types.js'
  export const courseCompletionPercentage = (
    progress: Progress,
    courseId: string,
  ) => {
    const courseProgress = progress.find((p: CourseProgress) => 
      (typeof p.course === 'object' ? p.course.id : p.course) === courseId
    )
    
    if (!courseProgress) {
      return 0
    }
    
    return courseProgress.completionPercentage || 0
  }