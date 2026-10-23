import { APIError, type DefaultDocumentIDType, type PayloadRequest } from 'payload';
import type { CollectionSlugMap } from '../types.js';
/**
 * The plugin cannot know the consumer's generated types, so documents are loosely typed.
 */
export type LMSDoc = {
    [key: string]: any;
    id: DefaultDocumentIDType;
};
export type ID = DefaultDocumentIDType;
type Relation = {
    id: ID;
} | ID | null | undefined;
export type CourseProgressEntry = {
    completed?: boolean | null;
    completedAt?: null | string;
    completedLessons: {
        completedAt: string;
        lesson: ID;
    }[];
    completedQuizzes: {
        attempts?: null | number;
        completedAt: string;
        lastAttemptAt?: null | string;
        quiz: ID;
        score: number;
    }[];
    course: ID;
};
/**
 * An error whose message is safe to return to the client.
 */
export declare class LMSError extends APIError {
    constructor(message: string, status: number);
}
export declare const toId: (value: Relation) => ID | undefined;
export declare const toIds: (values: unknown) => ID[];
/**
 * Compares IDs as strings so ObjectId instances and string IDs match.
 */
export declare const sameId: (a: Relation, b: Relation) => boolean;
export declare const includesId: (ids: Relation[], id: Relation) => boolean;
export declare const getSlugs: (req: PayloadRequest) => CollectionSlugMap;
export declare const asSlug: (slug: string) => string;
/**
 * Runs `fn` inside a transaction, reusing one already open on `req`.
 */
export declare const withTransaction: <T>(req: PayloadRequest, fn: () => Promise<T>) => Promise<T>;
export declare const findDoc: (req: PayloadRequest, collection: string, id: ID, label: string) => Promise<LMSDoc>;
/**
 * Normalises the user's progress to IDs so it can be compared and saved back.
 */
export declare const getCoursesProgress: (user: LMSDoc) => CourseProgressEntry[];
/**
 * Returns the progress entry for a course, adding an empty one when missing.
 */
export declare const ensureCourseProgress: (coursesProgress: CourseProgressEntry[], courseId: ID) => CourseProgressEntry;
export declare const getCourseLessonIds: (course: LMSDoc, { requiredOnly }?: {
    requiredOnly?: boolean | undefined;
}) => ID[];
export declare const hasCompletedRequiredLessons: (course: LMSDoc, progress: CourseProgressEntry) => boolean;
/**
 * A user is enrolled when they are listed on the course directly, have completed it,
 * or belong to a group enrolled in it.
 */
export declare const isEnrolledInCourse: (req: PayloadRequest, course: LMSDoc, userId: ID) => Promise<boolean>;
export declare const requireUser: (req: PayloadRequest) => ID;
type SeatManagement = {
    seatsTotal?: null | number;
    seatsUsed?: null | number;
} | undefined;
export declare const hasFreeSeat: (seatManagement: SeatManagement) => boolean;
/**
 * Takes one seat on every course the group purchased. Throws when any of them is full.
 */
export declare const takeSeatOnEachPurchase: (purchasedCourses: LMSDoc[]) => LMSDoc[];
export {};
