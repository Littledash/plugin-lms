import { addDataAndFileToRequest } from 'payload';
import { LMSError, requireUser } from '../services/shared.js';
/**
 * Wraps an LMS endpoint: requires a logged-in user, parses the body, rejects client-supplied
 * user IDs, and turns errors into JSON responses without leaking internal details.
 */ export const lmsHandler = (fn)=>async (req)=>{
        try {
            const userId = requireUser(req);
            if (req.method !== 'GET') {
                await addDataAndFileToRequest(req);
            }
            const data = req.data || {};
            if ('userId' in data || 'userID' in data) {
                throw new LMSError('userId is not accepted. Endpoints act on the logged-in user; use the server-side LMS services for other users.', 400);
            }
            return await fn({
                data,
                req,
                userId
            });
        } catch (error) {
            if (error instanceof LMSError) {
                return Response.json({
                    message: error.message
                }, {
                    status: error.status
                });
            }
            req.payload.logger.error({
                err: error
            }, 'LMS endpoint failed');
            return Response.json({
                message: 'Something went wrong. Please try again.'
            }, {
                status: 500
            });
        }
    };
export const requireFields = (data, fields)=>{
    const missing = fields.filter((field)=>data[field] === undefined || data[field] === null || data[field] === '');
    if (missing.length > 0) {
        throw new LMSError(`Missing required fields: ${missing.join(', ')}.`, 400);
    }
};

//# sourceMappingURL=handler.js.map