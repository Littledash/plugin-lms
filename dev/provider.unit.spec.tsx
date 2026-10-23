/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React, { useState } from 'react'

import { LMSProvider, useLMS } from '../src/providers/index.js'

const fetchMock = jest.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()

const json = (body: unknown, status = 200) =>
  ({
    json: () => Promise.resolve(body),
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  }) as Response

const urls = () => fetchMock.mock.calls.map(([input]) => String(input))

const requestBody = (urlPart: string) => {
  const call = fetchMock.mock.calls.find(([input]) => String(input).includes(urlPart))
  return JSON.parse(String(call?.[1]?.body))
}

const Harness = () => {
  const lms = useLMS()
  const [last, setLast] = useState('')
  const progress = lms.getProgress('course-1')
  const storedLesson = progress?.completedLessons[0]?.lesson
  const lessonId = typeof storedLesson === 'object' && storedLesson !== null ? storedLesson.id : storedLesson

  return (
    <>
      <p data-testid="enrolled">{lms.enrolledCourses.join(',')}</p>
      <p data-testid="completed">{lms.completedCourses.join(',')}</p>
      <p data-testid="loading">{String(lms.isLoading)}</p>
      <p data-testid="error">{lms.error?.message ?? ''}</p>
      <p data-testid="lesson">{lessonId ?? ''}</p>
      <p data-testid="quiz">{lms.quizStarted?.quizId ?? ''}</p>
      <p data-testid="courses">{lms.courses.map((course) => String(course.id)).join(',')}</p>
      <p data-testid="last">{last}</p>
      <button onClick={() => { void lms.enroll('course-1') }} type="button">enroll</button>
      <button onClick={() => { void lms.startQuiz('quiz-1', 'course-1') }} type="button">start</button>
      <button
        onClick={() => {
          void lms.submitQuiz('course-1', 'quiz-1', { q: 'true' }).then((data) => setLast(JSON.stringify(data)))
        }}
        type="button"
      >
        submit
      </button>
      <button onClick={() => { void lms.fetchCourses() }} type="button">courses</button>
      <button onClick={() => { void lms.completeLesson('course-1', 'lesson-1') }} type="button">lesson</button>
      <button onClick={() => { void lms.addUserToGroup('group-1', 'user-2', 'student') }} type="button">group</button>
    </>
  )
}

const renderProvider = (syncLocalStorage: { key: string } | boolean = true) =>
  render(
    <LMSProvider api={{ apiRoute: '/api', serverURL: 'http://lms.test' }} syncLocalStorage={syncLocalStorage}>
      <Harness />
    </LMSProvider>,
  )

const settle = () =>
  waitFor(() => {
    expect(urls().some((url) => url.endsWith('/users/me'))).toBe(true)
    expect(screen.getByTestId('loading').textContent).toBe('false')
  })

describe('LMSProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    fetchMock.mockReset()
    globalThis.fetch = fetchMock as typeof fetch
  })

  it('loads enrolled and completed course ids for a logged-in user', async () => {
    fetchMock.mockImplementation((input) => {
      const url = String(input)
      if (url.endsWith('/users/me')) {return json({ user: { id: 'user-1' } })}
      if (url.endsWith('/lms/fetch-progress')) {
        return json({
          completedCourses: [{ id: 'course-2' }],
          coursesProgress: [],
          enrolledCourses: [{ id: 'course-1' }, { id: 'course-2' }],
        })
      }
      return json({})
    })

    renderProvider()
    await settle()

    expect(urls()[0]).toBe('http://lms.test/api/users/me')
    expect(screen.getByTestId('enrolled').textContent).toBe('course-1,course-2')
    expect(screen.getByTestId('completed').textContent).toBe('course-2')
  })

  it('normalizes stored progress to ids, then clears it when the user is logged out', async () => {
    let releaseMe: (response: Response) => void = () => {}
    const me = new Promise<Response>((resolve) => {
      releaseMe = resolve
    })
    localStorage.setItem(
      'lms',
      JSON.stringify({
        completedCourses: [],
        enrolledCourses: [{ id: 'course-1' }],
        progress: [
          {
            completed: false,
            completedLessons: [{ completedAt: '2026-01-01', lesson: { id: 'lesson-1' } }],
            completedQuizzes: [{ completedAt: '2026-01-01', quiz: { id: 'quiz-1' }, score: 1 }],
            course: { id: 'course-1' },
          },
        ],
      }),
    )
    fetchMock.mockImplementation((input) => {
      if (String(input).endsWith('/users/me')) {return me}
      return json({ completedCourses: [], coursesProgress: [], enrolledCourses: [] })
    })

    renderProvider()
    await waitFor(() => expect(screen.getByTestId('lesson').textContent).toBe('lesson-1'))
    expect(screen.getByTestId('enrolled').textContent).toBe('course-1')

    releaseMe(json({}, 401))
    await settle()
    expect(screen.getByTestId('enrolled').textContent).toBe('')
    expect(screen.getByTestId('lesson').textContent).toBe('')
    expect(urls().some((url) => url.endsWith('/lms/fetch-progress'))).toBe(false)
  })

  it('enrolls the current user and refreshes progress', async () => {
    let progressCalls = 0
    fetchMock.mockImplementation((input) => {
      const url = String(input)
      if (url.endsWith('/users/me')) {return json({ user: { id: 'user-1' } })}
      if (url.endsWith('/lms/enroll')) {return json({ status: 'enrolled' })}
      progressCalls += 1
      return json({
        completedCourses: [],
        coursesProgress: [],
        enrolledCourses: progressCalls > 1 ? [{ id: 'course-1' }] : [],
      })
    })

    renderProvider()
    await settle()
    expect(screen.getByTestId('enrolled').textContent).toBe('')
    fireEvent.click(screen.getByRole('button', { name: 'enroll' }))
    await waitFor(() => expect(screen.getByTestId('enrolled').textContent).toBe('course-1'))

    expect(requestBody('/lms/enroll')).toEqual({ courseId: 'course-1' })
    expect(urls().filter((url) => url.endsWith('/lms/fetch-progress'))).toHaveLength(2)
  })

  it('reports a failed quiz submission', async () => {
    fetchMock.mockImplementation((input) => {
      const url = String(input)
      if (url.endsWith('/users/me')) {return json({ user: { id: 'user-1' } })}
      if (url.endsWith('/lms/submit-quiz')) {return json({ message: 'no' }, 400)}
      return json({ completedCourses: [], coursesProgress: [], enrolledCourses: [] })
    })

    renderProvider()
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() => expect(screen.getByTestId('last').textContent).toContain('"passed":false'))
    expect(screen.getByTestId('error').textContent).toBe('Failed to submit quiz')
    expect(requestBody('/lms/submit-quiz')).toEqual({
      answers: { q: 'true' },
      courseId: 'course-1',
      quizId: 'quiz-1',
    })
  })

  it('clears the in-progress quiz after a passing submission', async () => {
    fetchMock.mockImplementation((input) => {
      const url = String(input)
      if (url.endsWith('/users/me')) {return json({ user: { id: 'user-1' } })}
      if (url.endsWith('/lms/submit-quiz')) {return json({ passed: true, score: 80 })}
      return json({ completedCourses: [], coursesProgress: [], enrolledCourses: [] })
    })

    renderProvider()
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'start' }))
    expect(screen.getByTestId('quiz').textContent).toBe('quiz-1')

    fireEvent.click(screen.getByRole('button', { name: 'submit' }))
    await waitFor(() => expect(screen.getByTestId('quiz').textContent).toBe(''))
    expect(screen.getByTestId('last').textContent).toContain('"score":80')
  })

  it('does not call the network when storage sync is off', async () => {
    renderProvider(false)
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(localStorage.getItem('lms')).toBeNull()
  })

  it('stores courses and surfaces a failed course request', async () => {
    fetchMock.mockImplementation((input) => {
      const url = String(input)
      if (url.endsWith('/users/me')) {return json({ user: { id: 'user-1' } })}
      if (url.endsWith('/courses')) {return json({ docs: [{ id: 'course-1', title: 'One' }] })}
      return json({ completedCourses: [], coursesProgress: [], enrolledCourses: [] })
    })

    renderProvider()
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'courses' }))
    await waitFor(() => expect(screen.getByTestId('courses').textContent).toBe('course-1'))

    fetchMock.mockImplementation((input) => {
      if (String(input).endsWith('/courses')) {return json({ message: 'no' }, 500)}
      return json({})
    })
    fireEvent.click(screen.getByRole('button', { name: 'courses' }))
    await waitFor(() => expect(screen.getByTestId('error').textContent).toBe('Failed to fetch courses'))
    expect(screen.getByTestId('courses').textContent).toBe('')
  })

  it('posts the lesson and the group member for the current user', async () => {
    fetchMock.mockImplementation((input) => {
      const url = String(input)
      if (url.endsWith('/users/me')) {return json({ user: { id: 'user-1' } })}
      return json({ completedCourses: [], coursesProgress: [], enrolledCourses: [] })
    })

    renderProvider()
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'lesson' }))
    fireEvent.click(screen.getByRole('button', { name: 'group' }))
    await waitFor(() => expect(urls().some((url) => url.endsWith('/lms/add-user-to-group'))).toBe(true))

    expect(requestBody('/lms/complete-lesson')).toEqual({ courseId: 'course-1', lessonId: 'lesson-1' })
    expect(requestBody('/lms/add-user-to-group')).toEqual({
      groupId: 'group-1',
      memberId: 'user-2',
      role: 'student',
    })
  })
})
