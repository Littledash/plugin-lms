import { CourseProgress, Progress, Lesson, Quiz } from '../providers/types.js'

/**
 * @fileoverview Utility functions for checking lesson completion status
 * 
 * This module provides functions to check if a lesson is completed, including
 * both lesson completion and quiz completion requirements.
 * 
 * @example
 * ```typescript
 * import { completedLesson, lessonHasQuizzes, allQuizzesCompleted } from './completedLesson'
 * 
 * // Basic usage - only checks if lesson is marked as completed
 * const basicStatus = completedLesson(progress, courseId, lessonId)
 * console.log(basicStatus.isCompleted) // true/false
 * 
 * // Advanced usage - includes quiz completion checking
 * const fullStatus = completedLesson(progress, courseId, lessonId, lessonObject)
 * console.log(fullStatus) // { isCompleted: boolean, hasQuizzes: boolean, allQuizzesCompleted: boolean, lessonCompleted: boolean }
 * 
 * // Check if lesson has quizzes
 * const hasQuizzes = lessonHasQuizzes(lessonObject)
 * 
 * // Check if all quizzes for a lesson are completed
 * const allQuizzesDone = allQuizzesCompleted(courseProgress, lessonObject)
 * ```
 */

/**
 * Checks if a lesson has any quizzes associated with it
 * @param lesson - The lesson object to check
 * @returns boolean indicating if the lesson has quizzes
 */
export const lessonHasQuizzes = (lesson: Lesson): boolean => {
  return Boolean(lesson.quizzes && Array.isArray(lesson.quizzes) && lesson.quizzes.length > 0)
}

/**
 * Checks if all quizzes for a lesson are completed
 * @param courseProgress - The course progress object
 * @param lesson - The lesson object to check
 * @returns boolean indicating if all quizzes are completed
 */
export const allQuizzesCompleted = (courseProgress: CourseProgress, lesson: Lesson): boolean => {
  if (!lessonHasQuizzes(lesson)) {
    return true // No quizzes means "all quizzes completed"
  }

  const lessonQuizIds = lesson.quizzes.map((quiz: Quiz | string) => 
    typeof quiz === 'object' ? quiz.id : quiz
  )

  return lessonQuizIds.every((quizId: string) => 
    courseProgress.completedQuizzes.some((cq) => 
      typeof cq.quiz === 'object' ? cq.quiz.id === quizId : cq.quiz === quizId
    )
  )
}

/**
 * Checks if a lesson is completed, including both lesson completion and quiz completion
 * @param progress - The user's progress across all courses
 * @param courseId - The ID of the course
 * @param lesson - The lesson object to check
 * @returns object with completion status details
 */
export const completedLesson = (
  progress: Progress,
  courseId: string,
  lesson: Lesson,
) => {
  const courseProgress = progress.find((p: CourseProgress) => 
    (typeof p.course === 'object' ? p.course.id : p.course) === courseId
  )
  
  if (!courseProgress) {
    return {
      isCompleted: false,
      hasQuizzes: false,
      allQuizzesCompleted: false,
      lessonCompleted: false
    }
  }
  
  const lessonCompleted = Boolean(
    courseProgress.completedLessons.find((l) => 
      typeof l.lesson === 'object' ? l.lesson.id : l.lesson === lesson.id
    )
  )

  // If no lesson object provided, return basic completion status
  if (!lesson) {
    return {
      isCompleted: lessonCompleted,
      hasQuizzes: false,
      allQuizzesCompleted: false,
      lessonCompleted
    }
  }

  const hasQuizzes = lessonHasQuizzes(lesson)
  const allQuizzesCompletedForLesson = allQuizzesCompleted(courseProgress, lesson)
  
  // A lesson is fully completed if:
  // 1. The lesson itself is marked as completed, AND
  // 2. Either there are no quizzes, OR all quizzes are completed
  const isCompleted = lessonCompleted && (!hasQuizzes || allQuizzesCompletedForLesson)
  
  return {
    isCompleted,
    hasQuizzes,
    allQuizzesCompleted: allQuizzesCompletedForLesson,
    lessonCompleted
  }
}