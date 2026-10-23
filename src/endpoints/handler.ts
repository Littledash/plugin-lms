import { addDataAndFileToRequest, type Endpoint, type PayloadRequest } from 'payload'

import { type ID, LMSError, requireUser } from '../services/shared.js'

type HandlerContext = {
  data: Record<string, unknown>
  req: PayloadRequest
  /** Always the authenticated user. Endpoints never act on a user ID sent by the client. */
  userId: ID
}

/**
 * Wraps an LMS endpoint: requires a logged-in user, parses the body, rejects client-supplied
 * user IDs, and turns errors into JSON responses without leaking internal details.
 */
export const lmsHandler =
  (fn: (context: HandlerContext) => Promise<Response>): Endpoint['handler'] =>
  async (req) => {
    try {
      const userId = requireUser(req)
      if (req.method !== 'GET') {
        await addDataAndFileToRequest(req)
      }
      const data = (req.data || {}) as Record<string, unknown>

      if ('userId' in data || 'userID' in data) {
        throw new LMSError(
          'userId is not accepted. Endpoints act on the logged-in user; use the server-side LMS services for other users.',
          400,
        )
      }

      return await fn({ data, req, userId })
    } catch (error: unknown) {
      if (error instanceof LMSError) {
        return Response.json({ message: error.message }, { status: error.status })
      }
      req.payload.logger.error({ err: error }, 'LMS endpoint failed')
      return Response.json({ message: 'Something went wrong. Please try again.' }, { status: 500 })
    }
  }

export const requireFields = (data: Record<string, unknown>, fields: string[]) => {
  const missing = fields.filter((field) => data[field] === undefined || data[field] === null || data[field] === '')
  if (missing.length > 0) {
    throw new LMSError(`Missing required fields: ${missing.join(', ')}.`, 400)
  }
}
