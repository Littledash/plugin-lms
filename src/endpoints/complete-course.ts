import type { Endpoint } from 'payload'

import { completeCourse } from '../services/completeCourse.js'
import { type ID, LMSError } from '../services/shared.js'
import { lmsHandler, requireFields } from './handler.js'

export const completeCourseHandler = (_args?: Record<string, unknown>): Endpoint['handler'] =>
  lmsHandler(async ({ data, req, userId }) => {
    requireFields(data, ['courseId'])
    const { certificateAwarded, status } = await completeCourse({
      courseId: data.courseId as ID,
      req,
      userId,
    })
    if (status === 'already-completed' && !certificateAwarded) {
      throw new LMSError('You have already completed this course.', 409)
    }
    return Response.json({ certificateAwarded, message: 'Successfully completed course.', success: true })
  })
