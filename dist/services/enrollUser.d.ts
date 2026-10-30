import type { PayloadRequest } from 'payload';
import { type ID } from './shared.js';
export type GroupEnrollment = {
    /** Title for a new group. Never used to join an existing group. */
    companyName?: null | string;
    /** Joins the group that purchased the course with this coupon. */
    couponId?: ID | null;
    isLeader?: boolean;
    totalSeats?: number;
};
type EnrollUserArgs = {
    courseId: ID;
    group?: GroupEnrollment;
    /**
     * Start a new access period when the user already has this course, for example when an
     * expired student buys it again. Only pass it for a verified purchase. `key` identifies the
     * purchase (an order id): a second call with the same key does nothing, so webhook retries and
     * several fulfilment paths cannot add extra periods.
     */
    renewal?: {
        key: string;
    };
    req: PayloadRequest;
    userId: ID;
};
export type EnrollUserResult = {
    groupId?: ID;
    status: 'already-completed' | 'already-enrolled' | 'already-renewed' | 'enrolled' | 'renewed';
};
/**
 * Enrolls a user in a course, optionally through a group purchase.
 *
 * This is a trusted server-side operation: it does not check payment. Call it only after the
 * purchase has been verified, with a `userId` taken from trusted server state.
 */
export declare const enrollUser: ({ courseId, group, renewal, req, userId, }: EnrollUserArgs) => Promise<EnrollUserResult>;
/**
 * Access modes a user can enroll in themselves without a purchase.
 */
export declare const SELF_ENROLL_ACCESS_MODES: string[];
export {};
