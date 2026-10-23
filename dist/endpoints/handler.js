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
const ID_PATTERN = /^[\w-]{1,64}$/;
/**
 * Reads a document ID from the body. Only plain strings and positive integers are accepted, so
 * query objects such as `{ "$ne": null }` never reach the database.
 */ export const requireId = (data, field)=>{
    const value = data[field];
    if (typeof value === 'string' && ID_PATTERN.test(value)) {
        return value;
    }
    if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
        return value;
    }
    throw new LMSError(`${field} must be a valid ID.`, 400);
};
const MAX_ANSWERS = 500;
/**
 * Reads quiz answers: an object keyed by question ID with primitive values.
 */ export const requireAnswers = (data)=>{
    const { answers } = data;
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
        throw new LMSError('answers must be an object keyed by question ID.', 400);
    }
    const entries = Object.entries(answers);
    if (entries.length > MAX_ANSWERS) {
        throw new LMSError('Too many answers.', 400);
    }
    if (entries.some(([, value])=>value !== null && typeof value === 'object')) {
        throw new LMSError('Each answer must be a string, number or boolean.', 400);
    }
    return answers;
};

//# sourceMappingURL=handler.js.map