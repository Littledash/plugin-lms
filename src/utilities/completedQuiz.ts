import type { DefaultDocumentIDType } from 'payload'
import { CourseProgress, Progress, Quiz } from '../providers/types.js'

/**
 * @fileoverview Utility functions for checking quiz completion and passing status
 * 
 * This module provides functions to check if a quiz is completed and passed for a user.
 * A quiz is considered passed if the score is greater than or equal to the quiz's minimumScore.
 * 
 * @example
 * ```typescript
 * import { completedQuiz, isQuizCompleted, isQuizPassed } from './completedQuiz'
 * 
 * // Check quiz completion and passing status
 * const status = completedQuiz(progress, courseId, quizObject)
 * console.log(status) // { isCompleted: boolean, passed: boolean | null, score: number | null, completedAt: string | null }
 * 
 * // Simple boolean check if quiz is completed
 * const isDone = isQuizCompleted(progress, courseId, quizId)
 * 
 * // Simple boolean check if quiz is passed (requires quiz object for minimumScore)
 * const isPassed = isQuizPassed(progress, courseId, quizObject)
 * ```
 */

/**
 * Checks if a quiz is completed for a specific course
 * @param courseProgress - The course progress object
 * @param quiz - The quiz object or quiz ID to check
 * @returns object with quiz ID if found, or null
 */
const findCompletedQuiz = (
  courseProgress: CourseProgress,
  quiz: Quiz | DefaultDocumentIDType
): CourseProgress['completedQuizzes'][number] | null => {
  const quizId = typeof quiz === 'object' ? quiz.id : quiz
  
  return courseProgress.completedQuizzes.find((cq) => 
    typeof cq.quiz === 'object' ? cq.quiz.id === quizId : cq.quiz === quizId
  ) || null
}

/**
 * Checks if a quiz is completed for a specific course
 * @param progress - The user's progress across all courses
 * @param courseId - The ID of the course
 * @param quiz - The quiz object or quiz ID to check
 * @returns boolean indicating if the quiz is completed
 */
export const isQuizCompleted = (
  progress: Progress,
  courseId: DefaultDocumentIDType,
  quiz: Quiz | DefaultDocumentIDType
): boolean => {
  const courseProgress = progress.find((p: CourseProgress) => 
    (typeof p.course === 'object' ? p.course.id : p.course) === courseId
  )
  
  if (!courseProgress) {
    return false
  }
  
  return findCompletedQuiz(courseProgress, quiz) !== null
}

/**
 * Checks if a quiz is passed based on score and minimumScore
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
 * Checks if a quiz is passed for a specific course
 * @param progress - The user's progress across all courses
 * @param courseId - The ID of the course
 * @param quiz - The quiz object (must include minimumScore) or quiz ID
 * @returns boolean indicating if the quiz is passed, or null if quiz object is not provided
 */
export const isQuizPassed = (
  progress: Progress,
  courseId: DefaultDocumentIDType,
  quiz: Quiz | DefaultDocumentIDType
): boolean | null => {
  const courseProgress = progress.find((p: CourseProgress) => 
    (typeof p.course === 'object' ? p.course.id : p.course) === courseId
  )
  
  if (!courseProgress) {
    return false
  }
  
  const completedQuizEntry = findCompletedQuiz(courseProgress, quiz)
  
  if (!completedQuizEntry) {
    return false
  }
  
  // Need quiz object to check minimumScore
  if (typeof quiz !== 'object') {
    return null // Can't determine without quiz object
  }
  
  return isScorePassing(completedQuizEntry.score, quiz.minimumScore)
}

/**
 * Checks if a quiz is completed and passed, including completion details
 * @param progress - The user's progress across all courses
 * @param courseId - The ID of the course
 * @param quiz - The quiz object or quiz ID to check (quiz object recommended to check passing status)
 * @returns object with completion and passing status details
 */
export const completedQuiz = (
  progress: Progress,
  courseId: DefaultDocumentIDType,
  quiz: Quiz | DefaultDocumentIDType,
) => {
  const courseProgress = progress.find((p: CourseProgress) => 
    (typeof p.course === 'object' ? p.course.id : p.course) === courseId
  )
  
  if (!courseProgress) {
    return {
      isCompleted: false,
      passed: null,
      score: null,
      completedAt: null
    }
  }
  
  const completedQuizEntry = findCompletedQuiz(courseProgress, quiz)
  
  if (!completedQuizEntry) {
    return {
      isCompleted: false,
      passed: null,
      score: null,
      completedAt: null
    }
  }
  
  // Check if passed if we have the quiz object with minimumScore
  const passed = typeof quiz === 'object' && quiz.minimumScore !== undefined
    ? isScorePassing(completedQuizEntry.score, quiz.minimumScore)
    : null
  
  return {
    isCompleted: true,
    passed,
    score: completedQuizEntry.score,
    completedAt: completedQuizEntry.completedAt
  }
}