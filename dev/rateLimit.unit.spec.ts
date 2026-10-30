import { takeRateLimitSlot, trackedRateLimitKeys } from '../src/endpoints/rateLimit.js'

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

  it('forgets users who have not called within the window', () => {
    const base = 1_000_000_000
    for (let user = 0; user < 50; user++) {
      takeRateLimitSlot({ key: `idle-${user}`, max: 5, now: base, windowMs: 1000 })
    }
    expect(trackedRateLimitKeys()).toBeGreaterThanOrEqual(50)

    // A later call by someone else, after the window, clears the idle users
    takeRateLimitSlot({ key: 'active', max: 5, now: base + 5000, windowMs: 1000 })
    expect(trackedRateLimitKeys()).toBe(1)
  })
})
