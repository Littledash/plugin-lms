import type { Endpoint } from 'payload'

import type { ID } from '../services/shared.js'

import { generateCertificate } from '../services/generateCertificate.js'
import { lmsHandler, requireFields } from './handler.js'

export const generateCertificateHandler = (_args?: Record<string, unknown>): Endpoint['handler'] =>
  lmsHandler(async ({ data, req, userId }) => {
    requireFields(data, ['courseId', 'certificateId'])
    const { media, status } = await generateCertificate({
      certificateId: data.certificateId as ID,
      courseId: data.courseId as ID,
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
