import { type Endpoint, type PayloadRequest } from 'payload';
import { type ID } from '../services/shared.js';
type HandlerContext = {
    data: Record<string, unknown>;
    req: PayloadRequest;
    /** Always the authenticated user. Endpoints never act on a user ID sent by the client. */
    userId: ID;
};
/**
 * Wraps an LMS endpoint: requires a logged-in user, parses the body, rejects client-supplied
 * user IDs, and turns errors into JSON responses without leaking internal details.
 */
export declare const lmsHandler: (fn: (context: HandlerContext) => Promise<Response>) => Endpoint["handler"];
export declare const requireFields: (data: Record<string, unknown>, fields: string[]) => void;
export {};
