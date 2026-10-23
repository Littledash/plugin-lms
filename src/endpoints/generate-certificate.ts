import type { Endpoint } from 'payload'

import { generateCertificate } from '../services/generateCertificate.js'
import { lmsHandler, requireId } from './handler.js'

export const generateCertificateHandler = (_args?: Record<string, unknown>): Endpoint['handler'] =>
  lmsHandler(async ({ data, req, userId }) => {
    const { media, status } = await generateCertificate({
      certificateId: requireId(data, 'certificateId'),
      courseId: requireId(data, 'courseId'),
      req,
      userId,
    })
    return Response.json({
      certificate: media,
      message: 'Successfully generated certificate.',
      status,
      success: true,
    })
  })
