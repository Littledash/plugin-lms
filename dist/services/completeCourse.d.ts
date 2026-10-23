import type { PayloadRequest } from 'payload';
import { type CourseProgressEntry, type ID, type LMSDoc } from './shared.js';
/**
 * Marks the course complete on the course and in the user's progress and awards the course
 * certificate if it has one. Returns the user fields to save; the caller saves them so the user
 * is updated once (consumer hooks on the users collection see progress and certificates together).
 */
export declare const markCourseCompleted: ({ course, coursesProgress, req, user, }: {
    course: LMSDoc;
    coursesProgress: CourseProgressEntry[];
    req: PayloadRequest;
    user: LMSDoc;
}) => Promise<{
    certificateAwarded: boolean;
    userData: Record<string, unknown>;
}>;
type CompleteCourseArgs = {
    courseId: ID;
    req: PayloadRequest;
    /**
     * Require every non-optional lesson to be completed first. Only disable this for trusted
     * administrative flows.
     */
    requireLessons?: boolean;
    userId: ID;
};
export type CompleteCourseResult = {
    certificateAwarded: boolean;
    status: 'already-completed' | 'completed';
};
/**
 * Completes a course for a user. Safe to call again: an already completed course only has a
 * missing certificate awarded.
 */
export declare const completeCourse: ({ courseId, req, requireLessons, userId, }: CompleteCourseArgs) => Promise<CompleteCourseResult>;
export {};
