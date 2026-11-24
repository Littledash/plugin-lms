import type { PayloadRequest } from 'payload';
import { type ID, type LMSDoc } from './shared.js';
/** Leaders and students of a group, each once. */
export declare const groupMemberIds: (group: LMSDoc) => ID[];
/** Clears revoked progress on the course, for users who have access again through a group. */
export declare const clearRevocations: ({ courseId, req, userIds, }: {
    courseId: ID;
    req: PayloadRequest;
    userIds: ID[];
}) => Promise<void>;
export type UnenrollUserResult = {
    /**
     * The user still has access through a group enrolled in the course (as a member or leader).
     * `unenrollUser` does not change groups; use `unenrollGroup` for a refunded group purchase.
     */
    groupAccess: boolean;
    status: 'not-enrolled' | 'unenrolled';
};
/**
 * Takes a user's access to a course away, for example after a refund or a payment dispute. The
 * user is removed from the course's enrolled and completed students, which stops access to its
 * lessons, topics, quizzes, files and materials. Their progress is kept, marked revoked, so
 * `enrollUser` for a new purchase restores it with a fresh access period. Certificates already
 * awarded are not touched. Safe to call again: a user who is not listed is left alone.
 *
 * Trusted server-side operation, like `enrollUser`: call it only with a `userId` from verified
 * server state, such as a payment provider webhook.
 */
export declare const unenrollUser: ({ courseId, reason, req, userId, }: {
    courseId: ID;
    /** Stored on the progress entry, for example "refund" or "dispute". */
    reason?: null | string;
    req: PayloadRequest;
    userId: ID;
}) => Promise<UnenrollUserResult>;
export type UnenrollGroupResult = {
    status: 'not-enrolled' | 'unenrolled';
    /** Leaders and students who lost access to the course. Empty when nothing changed. */
    unenrolledUserIds: ID[];
};
/**
 * Takes a course away from a group, for example after its purchase was refunded or disputed. The
 * group is removed from the course's enrolled groups and its purchase of the course is marked
 * revoked: the purchase's coupon stops working and takes no more seats. Every leader and student of
 * the group loses the course unless they still have access through another group, or are listed in
 * `keepUserIds` (members who bought the course themselves). Their progress is kept, marked revoked,
 * and certificates already awarded are not touched. Group membership and other courses the group
 * bought are not changed. Safe to call again.
 *
 * A new purchase by a leader of the same group (`enrollUser` with `group.isLeader`) restores the
 * purchase with the seats bought and gives every member the course back.
 *
 * Trusted server-side operation: call it only with IDs from verified server state.
 */
export declare const unenrollGroup: ({ courseId, groupId, keepUserIds, reason, req, }: {
    courseId: ID;
    groupId: ID;
    /** Members who keep the course, for example because they also bought it themselves. */
    keepUserIds?: ID[];
    /** Stored on the group purchase and on each member's progress, for example "refund". */
    reason?: null | string;
    req: PayloadRequest;
}) => Promise<UnenrollGroupResult>;
