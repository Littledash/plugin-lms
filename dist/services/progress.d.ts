import type { PayloadRequest } from 'payload';
import { getCoursesProgress, type ID } from './shared.js';
type CompleteLessonArgs = {
    courseId: ID;
    lessonId: ID;
    req: PayloadRequest;
    userId: ID;
};
export type CompleteLessonResult = {
    courseCompleted: boolean;
};
/**
 * Records a completed lesson. The lesson must belong to the course, the user must be enrolled,
 * and every quiz on the lesson must already be passed. Completing the last required lesson
 * completes the course.
 */
export declare const completeLesson: ({ courseId, lessonId, req, userId, }: CompleteLessonArgs) => Promise<CompleteLessonResult>;
type SubmitQuizArgs = {
    answers: Record<string, unknown>;
    courseId: ID;
    quizId: ID;
    req: PayloadRequest;
    userId: ID;
};
export type SubmitQuizResult = {
    minimumScore: number;
    passed: boolean;
    score: number;
};
/**
 * Grades a quiz attempt and keeps the user's best score. The quiz must belong to a lesson in the
 * course and the user must be enrolled.
 */
export declare const submitQuiz: ({ answers, courseId, quizId, req, userId, }: SubmitQuizArgs) => Promise<SubmitQuizResult>;
export type ProgressResult = {
    completedCourses: ID[];
    coursesProgress: ({
        completionPercentage: number;
        courseCompletion: string;
    } & ReturnType<typeof getCoursesProgress>[number])[];
    enrolledCourses: ID[];
};
/**
 * Returns the user's progress with a completion percentage per course.
 */
export declare const getProgress: ({ req, userId, }: {
    req: PayloadRequest;
    userId: ID;
}) => Promise<ProgressResult>;
export {};
