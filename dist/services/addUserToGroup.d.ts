import type { PayloadRequest } from 'payload';
import { type ID } from './shared.js';
type AddUserToGroupArgs = {
    groupId: ID;
    req: PayloadRequest;
    role: 'leader' | 'student';
    userId: ID;
};
/**
 * Adds a user to a group as a leader or student. Does not check who is asking; the endpoint
 * checks that the requester is an admin or a leader of the group.
 */
export declare const addUserToGroup: ({ groupId, req, role, userId }: AddUserToGroupArgs) => Promise<void>;
export {};
