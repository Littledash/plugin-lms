import { CourseProgress, Progress, Lesson } from '../providers/types.js';
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
 * @param lessonId - The ID of the lesson
 * @param lesson - Optional lesson object (if not provided, only checks lesson completion)
 * @returns object with completion status details
 */
export declare const completedLesson: (progress: Progress, courseId: string, lessonId: string, lesson?: Lesson) => {
    isCompleted: boolean;
    hasQuizzes: boolean;
    allQuizzesCompleted: boolean;
    lessonCompleted: boolean;
};
