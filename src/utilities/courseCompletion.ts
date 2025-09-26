import { CourseProgress, Progress } from '../providers/types.js'
export const courseCompletion = (
    progress: Progress,
    courseId: string,
  ): string => {
    const courseProgress = progress.find((p: CourseProgress) => 
      (typeof p.course === 'object' ? p.course.id : p.course) === courseId
    )
    
    if (!courseProgress) {
      return ''
    }
    
    return courseProgress.courseCompletion || ''
  }