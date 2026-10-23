import { takeRateLimitSlot } from '../src/endpoints/rateLimit.js'

describe('LMS endpoint rate limit', () => {
  it('allows a fixed number of calls in a window, then allows them again once the window has passed', () => {
    const key = 'rate-limit-unit'
    const slot = (now: number) => takeRateLimitSlot({ key, max: 2, now, windowMs: 1000 })

    expect(slot(0)).toBe(true)
    expect(slot(10)).toBe(true)
    expect(slot(20)).toBe(false)
    expect(slot(1000)).toBe(true)
  })

  it('does not count calls when the limit is turned off', () => {
    const slot = () => takeRateLimitSlot({ key: 'rate-limit-off', max: 0, now: 0, windowMs: 1000 })
    expect(slot()).toBe(true)
    expect(slot()).toBe(true)
  })
})