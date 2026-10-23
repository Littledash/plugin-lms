import type { CourseProgress, Lesson, Progress } from '../src/providers/types.js'

import { completedLesson } from '../src/utilities/completedLesson.js'
import { isPreviousLessonCompleted } from '../src/utilities/isPreviousLessonCompleted.js'

const progressFor = (overrides: Partial<CourseProgress> = {}): Progress => [
  {
    completed: false,
    completedLessons: [],
    completedQuizzes: [],
    course: 'course-1',
    ...overrides,
  },
]

const lesson = (id: string, quizzes: Lesson['quizzes'] = []): Lesson => ({ id, quizzes }) as Lesson

const courseWith = (lessons: { lesson: unknown }[]) =>
  ({
    id: 'course-1',
    slug: 'course',
    lessons,
    title: 'Course',
  }) as never

describe('completedLesson', () => {
  it('is complete when the lesson is done and it has no quizzes', () => {
    const status = completedLesson(
      progressFor({ completedLessons: [{ completedAt: '2026-01-01', lesson: 'lesson-1' }] }),
      'course-1',
      lesson('lesson-1'),
    )

    expect(status).toMatchObject({ hasQuizzes: false, isCompleted: true, lessonCompleted: true })
  })

  it('does not treat a different populated lesson as this one', () => {
    const status = completedLesson(
      progressFor({
        completedLessons: [{ completedAt: '2026-01-01', lesson: { id: 'lesson-1' } }],
      }),
      'course-1',
      lesson('lesson-2'),
    )

    expect(status.lessonCompleted).toBe(false)
    expect(status.isCompleted).toBe(false)
  })

  it('stays incomplete when a quiz score is below the minimum', () => {
    const withQuiz = lesson('lesson-1', [{ id: 'quiz-1', minimumScore: 80 } as Lesson['quizzes'][number]])
    const progress = progressFor({
      completedLessons: [{ completedAt: '2026-01-01', lesson: 'lesson-1' }],
      completedQuizzes: [{ completedAt: '2026-01-01', quiz: 'quiz-1', score: 50 }],
    })

    expect(completedLesson(progress, 'course-1', withQuiz).isCompleted).toBe(false)

    progress[0].completedQuizzes[0].score = 80
    expect(completedLesson(progress, 'course-1', withQuiz).isCompleted).toBe(true)
  })

  it('matches a course stored as an object', () => {
    const status = completedLesson(
      progressFor({
        completedLessons: [{ completedAt: '2026-01-01', lesson: 'lesson-1' }],
        course: { id: 'course-1' },
      }),
      'course-1',
      lesson('lesson-1'),
    )

    expect(status.isCompleted).toBe(true)
  })
})

describe('isPreviousLessonCompleted', () => {
  it('allows the first lesson', () => {
    expect(
      isPreviousLessonCompleted(progressFor(), courseWith([{ lesson: 'lesson-1' }, { lesson: 'lesson-2' }]), 'lesson-1'),
    ).toBe(true)
  })

  it('blocks the next lesson when the previous one is only an id and is not done', () => {
    expect(
      isPreviousLessonCompleted(progressFor(), courseWith([{ lesson: 'lesson-1' }, { lesson: 'lesson-2' }]), 'lesson-2'),
    ).toBe(false)
  })

  it('allows the next lesson when that id is done', () => {
    const progress = progressFor({
      completedLessons: [{ completedAt: '2026-01-01', lesson: 'lesson-1' }],
    })

    expect(
      isPreviousLessonCompleted(progress, courseWith([{ lesson: 'lesson-1' }, { lesson: 'lesson-2' }]), 'lesson-2'),
    ).toBe(true)
  })

  it('requires the previous lesson quizzes when that lesson is populated', () => {
    const progress = progressFor({
      completedLessons: [{ completedAt: '2026-01-01', lesson: 'lesson-1' }],
      completedQuizzes: [{ completedAt: '2026-01-01', quiz: 'quiz-1', score: 0 }],
    })
    const course = courseWith([
      { lesson: { id: 'lesson-1', quizzes: [{ id: 'quiz-1', minimumScore: 100 }] } },
      { lesson: 'lesson-2' },
    ])

    expect(isPreviousLessonCompleted(progress, course, 'lesson-2')).toBe(false)

    progress[0].completedQuizzes[0].score = 100
    expect(isPreviousLessonCompleted(progress, course, 'lesson-2')).toBe(true)
  })
})
