import type { PayloadRequest } from 'payload';
import { type ID } from '../services/shared.js';
/**
 * Records one call and returns whether it is still inside the limit. A non-positive `max` means
 * no limit. Timestamps outside the window are dropped.
 */
export declare const takeRateLimitSlot: ({ key, max, now, windowMs, }: {
    key: string;
    max: number;
    now: number;
    windowMs: number;
}) => boolean;
/**
 * Shared limit for every LMS endpoint, counted per logged-in user.
 */
export declare const assertRateLimit: (req: PayloadRequest, userId: ID) => void;
