import type { Endpoint } from 'payload'

import { checkRole } from '../access/checkRole.js'
import { enrollUser, SELF_ENROLL_ACCESS_MODES } from '../services/enrollUser.js'
import { findDoc, getSlugs, type ID, LMSError } from '../services/shared.js'
import { lmsHandler, requireFields } from './handler.js'

/**
 * Self-enrollment for the logged-in user in open or free courses. Paid and group enrollments
 * must go through the server-side `enrollUser` service after the purchase is verified.
 */
export const enrollHandler = (_args?: Record<string, unknown>): Endpoint['handler'] =>
  lmsHandler(async ({ data, req, userId }) => {
    requireFields(data, ['courseId'])
    if (data.isGroup) {
      throw new LMSError('Group enrollment requires a purchase.', 403)
    }

    const course = await findDoc(req, getSlugs(req).courses, data.courseId as ID, 'Course')
    const accessMode = course.enrollment?.accessMode ?? 'open'
    if (!SELF_ENROLL_ACCESS_MODES.includes(accessMode) && !checkRole(['admin'], req.user)) {
      throw new LMSError('This course requires a purchase.', 403)
    }

    const { status } = await enrollUser({ courseId: course.id, req, userId })
    const messages = {
      'already-completed': 'You have already completed this course.',
      'already-enrolled': 'You are already enrolled in this course.',
      enrolled: 'Successfully enrolled in course.',
    }
    return Response.json({ message: messages[status], status, success: status === 'enrolled' })
  })
