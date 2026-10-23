import { getProgress } from '../services/progress.js';
import { lmsHandler } from './handler.js';
export const fetchProgressHandler = (_args)=>lmsHandler(async ({ req, userId })=>Response.json(await getProgress({
            req,
            userId
        })));

//# sourceMappingURL=fetch-progress.js.map