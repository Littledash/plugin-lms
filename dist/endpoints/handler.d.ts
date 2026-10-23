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
/**
 * Reads a document ID from the body. Only plain strings and positive integers are accepted, so
 * query objects such as `{ "$ne": null }` never reach the database.
 */
export declare const requireId: (data: Record<string, unknown>, field: string) => ID;
/**
 * Reads quiz answers: an object keyed by question ID with primitive values.
 */
export declare const requireAnswers: (data: Record<string, unknown>) => Record<string, unknown>;
export {};
