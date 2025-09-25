import { CourseProgress, Progress } from '../providers/types.js'
export const completedLesson = (
    progress: Progress,
    courseId: string,
    lessonId: string,
  ) => {
    const courseProgress = progress.find((p: CourseProgress) => 
      (typeof p.course === 'object' ? p.course.id : p.course) === courseId
    )
    
    if (!courseProgress) {
      return false
    }
    
    return Boolean(
      courseProgress.completedLessons.find((l) => 
        typeof l.lesson === 'object' ? l.lesson.id : l.lesson === lessonId
      )
    )
  }