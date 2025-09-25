import { CourseProgress, Progress } from '../providers/types.js'
export const courseCompletion = (
  export const courseCompletion = (
    progress: Progress,
    courseId: string,
  ) => {
    const courseProgress = progress.find((p: CourseProgress) => 
      (typeof p.course === 'object' ? p.course.id : p.course) === courseId
    )
    
    if (!courseProgress) {
      return ''
    }
    
    return courseProgress.courseCompletion || ''
  }