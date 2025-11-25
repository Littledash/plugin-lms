import type { DefaultDocumentIDType } from 'payload';
import { Progress, Quiz } from '../providers/types.js';
/**
 * Checks if a quiz is completed for a specific course
 * @param progress - The user's progress across all courses
 * @param courseId - The ID of the course
 * @param quiz - The quiz object or quiz ID to check
 * @returns boolean indicating if the quiz is completed
 */
export declare const isQuizCompleted: (progress: Progress, courseId: DefaultDocumentIDType, quiz: Quiz | DefaultDocumentIDType) => boolean;
/**
 * Checks if a quiz is passed for a specific course
 * @param progress - The user's progress across all courses
 * @param courseId - The ID of the course
 * @param quiz - The quiz object (must include minimumScore) or quiz ID
 * @returns boolean indicating if the quiz is passed, or null if quiz object is not provided
 */
export declare const isQuizPassed: (progress: Progress, courseId: DefaultDocumentIDType, quiz: Quiz | DefaultDocumentIDType) => boolean | null;
/**
 * Checks if a quiz is completed and passed, including completion details
 * @param progress - The user's progress across all courses
 * @param courseId - The ID of the course
 * @param quiz - The quiz object or quiz ID to check (quiz object recommended to check passing status)
 * @returns object with completion and passing status details
 */
export declare const completedQuiz: (progress: Progress, courseId: DefaultDocumentIDType, quiz: Quiz | DefaultDocumentIDType) => {
    isCompleted: boolean;
    passed: null;
    score: null;
    completedAt: null;
} | {
    isCompleted: boolean;
    passed: boolean | null;
    score: number;
    completedAt: string;
};
