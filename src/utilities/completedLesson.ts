import { CourseProgress, Progress, Lesson, Quiz } from '../providers/types.js'

/**
 * @fileoverview Utility functions for checking lesson completion status
 * 
 * This module provides functions to check if a lesson is completed, including
 * both lesson completion and quiz completion requirements. Quizzes are considered
 * completed only if the user's score meets or exceeds the quiz's minimum score requirement.
 * 
 * @example
 * ```typescript
 * import { completedLesson, lessonHasQuizzes, allQuizzesCompleted } from './completedLesson'
 * 
 * // Check lesson completion including quiz completion
 * const status = completedLesson(progress, courseId, lessonObject)
 * console.log(status) // { isCompleted: boolean, hasQuizzes: boolean, allQuizzesCompleted: boolean, lessonCompleted: boolean }
 * 
 * // Check if lesson has quizzes
 * const hasQuizzes = lessonHasQuizzes(lessonObject)
 * 
 * // Check if all quizzes for a lesson are completed and passed (score >= minimumScore)
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
 * Checks if a quiz score meets the minimum passing requirement
 * @param score - The user's score on the quiz
 * @param minimumScore - The minimum score required to pass the quiz
 * @returns boolean indicating if the quiz is passed
 */
const isScorePassing = (score: number, minimumScore?: number | null): boolean => {
  // Default minimumScore is 100 if not specified
  const requiredScore = minimumScore ?? 100
  return score >= requiredScore
}

/**
 * Checks if all quizzes for a lesson are completed and passed (score meets minimum requirement)
 * @param courseProgress - The course progress object
 * @param lesson - The lesson object to check
 * @returns boolean indicating if all quizzes are completed and passed
 */
export const allQuizzesCompleted = (courseProgress: CourseProgress, lesson: Lesson): boolean => {
  if (!lessonHasQuizzes(lesson)) {
    return true // No quizzes means "all quizzes completed"
  }

  return lesson.quizzes.every((quiz: Quiz | string) => {
    const quizId = typeof quiz === 'object' ? quiz.id : quiz
    const minimumScore = typeof quiz === 'object' ? quiz.minimumScore : undefined
    
    // Find the completed quiz entry
    const completedQuizEntry = courseProgress.completedQuizzes.find((cq) => 
      typeof cq.quiz === 'object' ? cq.quiz.id === quizId : cq.quiz === quizId
    )
    
    // Quiz must be completed
    if (!completedQuizEntry) {
      return false
    }
    
    // If we have the quiz object with minimumScore, check if the score meets the requirement
    if (typeof quiz === 'object' && minimumScore !== undefined) {
      return isScorePassing(completedQuizEntry.score, minimumScore)
    }
    
    // If we don't have the quiz object, we can't verify minimum score
    // Default to requiring 100% if minimumScore is not available
    return isScorePassing(completedQuizEntry.score, 100)
  })
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