import type { Endpoint } from 'payload'

import type { ID } from '../services/shared.js'

import { completeLesson } from '../services/progress.js'
import { lmsHandler, requireFields } from './handler.js'

export const completeLessonHandler = (_args?: Record<string, unknown>): Endpoint['handler'] =>
  lmsHandler(async ({ data, req, userId }) => {
    requireFields(data, ['courseId', 'lessonId'])
    const { courseCompleted } = await completeLesson({
      courseId: data.courseId as ID,
      lessonId: data.lessonId as ID,
      req,
      userId,
    })
    return Response.json({
      courseCompleted,
      message: courseCompleted
        ? 'Successfully completed course and lesson.'
        : 'Successfully completed lesson.',
      success: true,
    })
  })
