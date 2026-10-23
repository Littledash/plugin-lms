import { lessonBlockReason } from '../src/services/lessonAccess.js'

const now = new Date('2026-10-23T00:00:00.000Z')
const daysBefore = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

const course = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'course-1',
    courseSettings: {},
    lessons: [{ lesson: 'lesson-1' }, { isOptional: false, lesson: 'lesson-2' }],
    navigation: { navigationMode: 'linear' },
    ...overrides,
  }) as never

const progress = (overrides: Record<string, unknown> = {}) =>
  ({
    completedLessons: [],
    completedQuizzes: [],
    course: 'course-1',
    enrolledAt: daysBefore(0),
    ...overrides,
  }) as never

const lesson = (overrides: Record<string, unknown> = {}) =>
  ({ id: 'lesson-2', accessSettings: { lessonReleaseSchedule: 'immediately' }, ...overrides }) as never

describe('lesson access rules', () => {
  it('blocks a later lesson until the earlier one is complete', () => {
    expect(
      lessonBlockReason({ course: course(), lesson: lesson(), lessonId: 'lesson-2', now, progress: progress() }),
    ).toBe('linear')

    const done = progress({ completedLessons: [{ completedAt: daysBefore(0), lesson: 'lesson-1' }] })
    expect(lessonBlockReason({ course: course(), lesson: lesson(), lessonId: 'lesson-2', now, progress: done })).toBeNull()
  })

  it('allows any lesson when navigation is free, and skips an optional earlier lesson', () => {
    const free = course({ navigation: { navigationMode: 'free' } })
    expect(lessonBlockReason({ course: free, lesson: lesson(), lessonId: 'lesson-2', now, progress: progress() })).toBeNull()

    const optionalFirst = course({
      lessons: [{ isOptional: true, lesson: 'lesson-1' }, { lesson: 'lesson-2' }],
    })
    expect(
      lessonBlockReason({ course: optionalFirst, lesson: lesson(), lessonId: 'lesson-2', now, progress: progress() }),
    ).toBeNull()
  })

  it('holds a lesson until its enrollment delay has passed', () => {
    const held = lesson({ accessSettings: { lessonRelaseDays: 2, lessonReleaseSchedule: 'enrollment' } })
    expect(
      lessonBlockReason({ course: course(), lesson: held, lessonId: 'lesson-1', now, progress: progress() }),
    ).toBe('unreleased')

    const waited = progress({ enrolledAt: daysBefore(2) })
    expect(lessonBlockReason({ course: course(), lesson: held, lessonId: 'lesson-1', now, progress: waited })).toBeNull()
  })

  it('holds a lesson until its release date', () => {
    const future = lesson({
      accessSettings: { lessonReleaseDate: '2026-10-24T00:00:00.000Z', lessonReleaseSchedule: 'specificDate' },
    })
    expect(
      lessonBlockReason({ course: course(), lesson: future, lessonId: 'lesson-1', now, progress: progress() }),
    ).toBe('unreleased')

    const past = lesson({
      accessSettings: { lessonReleaseDate: '2026-10-22T00:00:00.000Z', lessonReleaseSchedule: 'specificDate' },
    })
    expect(lessonBlockReason({ course: course(), lesson: past, lessonId: 'lesson-1', now, progress: progress() })).toBeNull()
  })

  it('expires access after the configured number of days, and leaves an undated enrollment open', () => {
    const expiring = course({ courseSettings: { accessExpirationDays: 1 } })
    const recent = progress({ enrolledAt: daysBefore(0) })
    expect(
      lessonBlockReason({ course: expiring, lesson: lesson(), lessonId: 'lesson-1', now, progress: recent }),
    ).toBeNull()

    const old = progress({ enrolledAt: daysBefore(1) })
    expect(lessonBlockReason({ course: expiring, lesson: lesson(), lessonId: 'lesson-1', now, progress: old })).toBe(
      'expired',
    )

    const undated = progress({ enrolledAt: null })
    expect(
      lessonBlockReason({ course: expiring, lesson: lesson(), lessonId: 'lesson-1', now, progress: undated }),
    ).toBeNull()
  })
})
