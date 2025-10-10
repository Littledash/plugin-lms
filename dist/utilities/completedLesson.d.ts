import { CourseProgress, Progress, Lesson } from '../providers/types.js';
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
 * // Check lesson completion including quiz completion
 * const status = completedLesson(progress, courseId, lessonObject)
 * console.log(status) // { isCompleted: boolean, hasQuizzes: boolean, allQuizzesCompleted: boolean, lessonCompleted: boolean }
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
export declare const lessonHasQuizzes: (lesson: Lesson) => boolean;
/**
 * Checks if all quizzes for a lesson are completed
 * @param courseProgress - The course progress object
 * @param lesson - The lesson object to check
 * @returns boolean indicating if all quizzes are completed
 */
export declare const allQuizzesCompleted: (courseProgress: CourseProgress, lesson: Lesson) => boolean;
/**
 * Checks if a lesson is completed, including both lesson completion and quiz completion
 * @param progress - The user's progress across all courses
 * @param courseId - The ID of the course
 * @param lesson - The lesson object to check
 * @returns object with completion status details
 */
export declare const completedLesson: (progress: Progress, courseId: string, lesson: Lesson) => {
    isCompleted: boolean;
    hasQuizzes: boolean;
    allQuizzesCompleted: boolean;
    lessonCompleted: boolean;
};
