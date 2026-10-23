import type { Endpoint } from 'payload'

import { submitQuiz } from '../services/progress.js'
import { type ID, LMSError } from '../services/shared.js'
import { lmsHandler, requireFields } from './handler.js'

export const submitQuizHandler = (_args?: Record<string, unknown>): Endpoint['handler'] =>
  lmsHandler(async ({ data, req, userId }) => {
    requireFields(data, ['courseId', 'quizId', 'answers'])
    if (typeof data.answers !== 'object' || Array.isArray(data.answers)) {
      throw new LMSError('Answers must be an object keyed by question ID.', 400)
    }
    const { minimumScore, passed, score } = await submitQuiz({
      answers: data.answers as Record<string, unknown>,
      courseId: data.courseId as ID,
      quizId: data.quizId as ID,
      req,
      userId,
    })
    return Response.json({
      message: passed
        ? 'Quiz submitted successfully and successfully passed'
        : `Quiz submitted successfully but you did not pass. You can try again. Required score: ${minimumScore}%`,
      passed,
      score,
      success: true,
    })
  })
