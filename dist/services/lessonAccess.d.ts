import type { CourseProgressEntry, ID, LMSDoc } from './shared.js';
export type LessonBlock = 'expired' | 'linear' | 'unreleased';
/**
 * Access has expired when the course sets a positive `accessExpirationDays` and the student's
 * access started at least that many days ago. Enrollments with no date are left open: they
 * predate this field.
 */
export declare const isAccessExpired: (course: LMSDoc, progress: CourseProgressEntry | undefined, now?: Date) => boolean;
/**
 * Starts a new access period for a renewal purchase. A renewal before expiry is added to the end
 * of the current period, so paid days are not lost; after expiry it starts now. `enrolledAt` is
 * left alone so lessons already released by their delay stay released.
 */
export declare const renewAccess: (course: LMSDoc, progress: CourseProgressEntry, now?: Date) => void;
/**
 * Why a student cannot open this lesson right now, or null when they can.
 * Admins and authors are not checked here.
 */
export declare const lessonBlockReason: ({ course, lesson, lessonId, now, progress, }: {
    course: LMSDoc;
    lesson: LMSDoc;
    lessonId: ID;
    now?: Date;
    progress: CourseProgressEntry | undefined;
}) => LessonBlock | null;
export declare const assertLessonAccessible: (args: {
    course: LMSDoc;
    lesson: LMSDoc;
    lessonId: ID;
    progress: CourseProgressEntry | undefined;
}) => void;
