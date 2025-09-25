import { TypedCollection, DefaultDocumentIDType } from "payload"
import { CourseProgress, Progress } from "../providers/types.js"

export const isPreviousLessonCompleted = (
    progress: Progress,
    course: Pick<TypedCollection['courses'], 'id' | 'title' | 'slug' | 'lessons'>,
    lessonId: string,
  ) => {
    const lessonIndex = course.lessons?.findIndex(
      (l: { lesson: DefaultDocumentIDType | { id: DefaultDocumentIDType } }) => 
        typeof l.lesson === 'object' && l.lesson !== null && l.lesson.id === lessonId,
    )
    const previousLesson = lessonIndex !== undefined && lessonIndex > 0 ? course.lessons?.[lessonIndex - 1] : undefined
    if (!previousLesson) return true // If there is no previous lesson, then the previous lesson is completed
    
    const previousLessonId = typeof previousLesson.lesson === 'object' ? previousLesson.lesson.id : previousLesson.lesson
    
    const courseProgress = progress.find((p: CourseProgress) => 
      (typeof p.course === 'object' ? p.course.id : p.course) === course.id
    )
    
    if (!courseProgress) {
      return false
    }
    
    return (
      courseProgress.completedLessons.find(
        (l) => (typeof l.lesson === 'object' ? l.lesson.id : l.lesson) === previousLessonId,
      ) !== undefined
    )
  }