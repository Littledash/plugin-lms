import type { PayloadRequest } from 'payload'

import { type ID, LMSError } from '../services/shared.js'

const hits = new Map<string, number[]>()

/**
 * Records one call and returns whether it is still inside the limit. A non-positive `max` means
 * no limit. Timestamps outside the window are dropped.
 */
export const takeRateLimitSlot = ({
  key,
  max,
  now,
  windowMs,
}: {
  key: string
  max: number
  now: number
  windowMs: number
}): boolean => {
  if (max <= 0) {return true}
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs)
  if (recent.length >= max) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  return true
}

/**
 * Shared limit for every LMS endpoint, counted per logged-in user.
 */
export const assertRateLimit = (req: PayloadRequest, userId: ID): void => {
  const lms = req.payload.config.custom?.lms
  const max = typeof lms?.rateLimitMax === 'number' ? lms.rateLimitMax : 60
  const windowSeconds = typeof lms?.rateLimitWindowSeconds === 'number' ? lms.rateLimitWindowSeconds : 60
  const allowed = takeRateLimitSlot({
    key: String(userId),
    max,
    now: Date.now(),
    windowMs: windowSeconds * 1000,
  })
  if (!allowed) {
    throw new LMSError('Too many requests. Please wait and try again.', 429)
  }
}
