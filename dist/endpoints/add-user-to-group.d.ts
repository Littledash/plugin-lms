import type { Endpoint } from 'payload';
/**
 * Lets an admin or a leader of the group add another user to it. The user being added is
 * `memberId`; the requester is always the logged-in user.
 */
export declare const addUserToGroupHandler: (_args?: Record<string, unknown>) => Endpoint["handler"];
