import type { PayloadRequest } from 'payload';
import { type ID, type LMSDoc } from '../services/shared.js';
/** Loads a group for an access check. A missing id is `null`, not an exception. */
export declare const findGroup: (req: PayloadRequest, id: ID) => Promise<LMSDoc | null>;
