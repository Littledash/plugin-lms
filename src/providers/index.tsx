'use client'

import type { DefaultDocumentIDType, TypedUser } from 'payload'

import * as qs from 'qs-esm'
import React, { createContext, use, useCallback, useEffect, useReducer, useRef } from 'react'

import type { CourseProgress, LMSContextType, LMSProviderProps } from './types.js'

import { initialState, lmsReducer } from './reducer.js'

const defaultContext: LMSContextType = {
  addUserToGroup: async () => {},
  certificates: [],
  completeCourse: async () => {},
  completedCourses: [],
  completeLesson: async () => {},
  courses: [],
  enroll: async () => {},
  enrolledCourses: [],
  error: null,
  fetchCourses: async () => {},
  fetchLessons: async () => {},
  fetchProgress: async () => {},
  fetchQuizzes: async () => {},
  fetchTopics: async () => {},
  fetchUsers: async () => {},
  getProgress: () => undefined,
  isLoading: false,
  lessons: [],
  progress: [],
  quizStarted: null,
  quizzes: [],
  setQuizCompleted: async () => {},
  setQuizExited: async () => {},
  startQuiz: async () => {},
  submitQuiz: () =>
    Promise.resolve({
      message: 'An unknown error occurred submitting quiz. Please try again.',
      passed: false,
      score: 0,
    }),
  topics: [],
  users: [],
}

const LMSContext = createContext<LMSContextType>(defaultContext)

/** fetch-progress returns ids; older responses and caches held `{ id }` objects. */
const toCourseId = (
  course: { id: DefaultDocumentIDType } | DefaultDocumentIDType,
): DefaultDocumentIDType => (typeof course === 'object' && course !== null ? course.id : course)

const defaultLocalStorage = {
  key: 'lms',
}

export const LMSProvider: React.FC<LMSProviderProps> = ({
  api,
  children,
  syncLocalStorage = true,
}) => {
  const localStorageConfig =
    syncLocalStorage && typeof syncLocalStorage === 'object'
      ? {
          ...defaultLocalStorage,
          ...(syncLocalStorage as Record<string, unknown>),
        }
      : defaultLocalStorage

  const { apiRoute = '/api', serverURL = '' } = api || {}
  const baseAPIURL = `${serverURL}${apiRoute}`
  const [state, dispatch] = useReducer(lmsReducer, initialState)
  // The cache is only read or written once the logged-in user is known, so one person's progress
  // never shows for another on a shared browser
  const cachedUserId = useRef<null | string>(null)

  const getUser = useCallback(async () => {
    try {
      const response = await fetch(`${baseAPIURL}/users/me`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })

      // Handle 401 (Unauthorized) - user is not logged in, this is expected
      if (response.status === 401) {
        return null
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch user: ${errorText}`)
      }

      const userData = await response.json()

      if (userData.error) {
        throw new Error(`User fetch error: ${userData.error}`)
      }

      if (userData.user) {
        return userData.user as TypedUser
      }

      return null
    } catch (error) {
      // Only throw if it's not a 401 (which we already handled)
      throw new Error(
        `Failed to fetch user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }, [baseAPIURL])

  /**
   * Shows cached progress for this user while fresh data loads. A cache saved for anyone else, or
   * one without an owner (written by older versions), is removed.
   */
  const restoreCache = useCallback(
    (userId: string) => {
      const storedProgress = localStorage.getItem(localStorageConfig.key)
      if (!storedProgress) {
        return
      }
      try {
        const parsed = JSON.parse(storedProgress)
        if (parsed.userId !== userId) {
          localStorage.removeItem(localStorageConfig.key)
          return
        }

        // Normalize progress data to use IDs only for backward compatibility
        const normalizedProgress = (parsed.progress || []).map((progress: CourseProgress) => ({
          ...progress,
          completedLessons:
            progress.completedLessons?.map((lesson) => ({
              ...lesson,
              lesson:
                typeof lesson.lesson === 'object' && lesson.lesson !== null
                  ? lesson.lesson.id
                  : lesson.lesson,
            })) || [],
          completedQuizzes:
            progress.completedQuizzes?.map((quiz) => ({
              ...quiz,
              quiz: typeof quiz.quiz === 'object' && quiz.quiz !== null ? quiz.quiz.id : quiz.quiz,
            })) || [],
          completionPercentage: progress.completionPercentage || 0,
          course:
            typeof progress.course === 'object' && progress.course !== null
              ? progress.course.id
              : progress.course,
          courseCompletion: progress.courseCompletion || '',
        }))

        // Normalize enrolled and completed courses to use IDs only
        const normalizedEnrolledCourses = (parsed.enrolledCourses || []).map(toCourseId)
        const normalizedCompletedCourses = (parsed.completedCourses || []).map(toCourseId)

        dispatch({
          type: 'LOAD_FROM_STORAGE',
          payload: {
            completedCourses: normalizedCompletedCourses,
            enrolledCourses: normalizedEnrolledCourses,
            progress: normalizedProgress,
          },
        })
      } catch {
        localStorage.removeItem(localStorageConfig.key)
      }
    },
    [localStorageConfig.key],
  )

  const fetchProgress = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      // Check if user is logged in first
      const currentUser = await getUser()

      // If no user is logged in, reset progress, forget the cache and return early
      if (!currentUser) {
        cachedUserId.current = null
        if (syncLocalStorage) {
          localStorage.removeItem(localStorageConfig.key)
        }
        dispatch({ type: 'UPDATE_PROGRESS', payload: [] })
        dispatch({ type: 'SET_ENROLLED_COURSES', payload: [] })
        dispatch({ type: 'SET_COMPLETED_COURSES', payload: [] })
        return
      }

      const userId = String(currentUser.id)
      if (syncLocalStorage && cachedUserId.current !== userId) {
        restoreCache(userId)
      }
      cachedUserId.current = userId

      // User is logged in, fetch progress
      const response = await fetch(`${baseAPIURL}/lms/fetch-progress`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user progress')
      }
      const data = await response.json()
      const { completedCourses, coursesProgress, enrolledCourses } = data

      // Update all progress-related state
      dispatch({ type: 'UPDATE_PROGRESS', payload: coursesProgress || [] })

      // Ensure enrolledCourses is an array before mapping
      const enrolledCoursesArray = Array.isArray(enrolledCourses) ? enrolledCourses : []
      dispatch({ type: 'SET_ENROLLED_COURSES', payload: enrolledCoursesArray.map(toCourseId) })

      // Ensure completedCourses is an array before mapping
      const completedCoursesArray = Array.isArray(completedCourses) ? completedCourses : []
      dispatch({ type: 'SET_COMPLETED_COURSES', payload: completedCoursesArray.map(toCourseId) })
    } catch (e: unknown) {
      dispatch({
        type: 'SET_ERROR',
        payload: e instanceof Error ? e : new Error('An unknown error occurred'),
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [baseAPIURL, getUser, localStorageConfig.key, restoreCache, syncLocalStorage])

  // Load progress and course status from database on initial render. Cached progress is shown
  // only after the server confirms it belongs to the logged-in user.
  useEffect(() => {
    if (syncLocalStorage) {
      void fetchProgress()
    }
  }, [syncLocalStorage, fetchProgress])

  // Persist progress and course status to localStorage whenever they change
  useEffect(() => {
    if (syncLocalStorage && cachedUserId.current) {
      const serializedState = JSON.stringify({
        completedCourses: state.completedCourses,
        enrolledCourses: state.enrolledCourses,
        progress: state.progress,
        userId: cachedUserId.current,
      })
      localStorage.setItem(localStorageConfig.key, serializedState)
    }
  }, [
    state.progress,
    state.enrolledCourses,
    state.completedCourses,
    syncLocalStorage,
    localStorageConfig.key,
  ])

  const enroll = useCallback(
    async (courseId: DefaultDocumentIDType) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      try {
        const response = await fetch(`${baseAPIURL}/lms/enroll`, {
          body: JSON.stringify({ courseId }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        if (!response.ok) {
          throw new Error('Failed to enroll in course')
        }
        await fetchProgress() // Refetch progress to ensure state is up-to-date
      } catch (e: unknown) {
        dispatch({
          type: 'SET_ERROR',
          payload: e instanceof Error ? e : new Error('An unknown error occurred'),
        })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [baseAPIURL, fetchProgress],
  )

  const completeCourse = useCallback(
    async (courseId: DefaultDocumentIDType) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      try {
        const response = await fetch(`${baseAPIURL}/lms/complete-course`, {
          body: JSON.stringify({ courseId }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        if (!response.ok) {
          throw new Error('Failed to complete course')
        }
        await fetchProgress() // Refetch progress to ensure state is up-to-date
      } catch (e: unknown) {
        dispatch({
          type: 'SET_ERROR',
          payload: e instanceof Error ? e : new Error('An unknown error occurred'),
        })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [baseAPIURL, fetchProgress],
  )

  const completeLesson = useCallback(
    async (courseId: DefaultDocumentIDType, lessonId: DefaultDocumentIDType) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      try {
        await fetch(`${baseAPIURL}/lms/complete-lesson`, {
          body: JSON.stringify({ courseId, lessonId }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        await fetchProgress() // Refetch progress to ensure state is up-to-date
      } catch (e: unknown) {
        dispatch({
          type: 'SET_ERROR',
          payload: e instanceof Error ? e : new Error('An unknown error occurred'),
        })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [baseAPIURL, fetchProgress],
  )

  const startQuiz = useCallback(
    (quizId: DefaultDocumentIDType, courseId: DefaultDocumentIDType) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      dispatch({
        type: 'SET_QUIZ_STARTED',
        payload: { courseId, quizId, startedAt: new Date().toISOString() },
      })
      return Promise.resolve()
    },
    [],
  )

  const setQuizCompleted = useCallback((quizId: DefaultDocumentIDType, score: number) => {
    dispatch({
      type: 'SET_QUIZ_COMPLETED',
      payload: { completedAt: new Date().toISOString(), quizId, score },
    })
    return Promise.resolve()
  }, [])

  const setQuizExited = useCallback(
    (quizId: DefaultDocumentIDType, courseId: DefaultDocumentIDType) => {
      dispatch({
        type: 'SET_QUIZ_EXITED',
        payload: { courseId, exitedAt: new Date().toISOString(), quizId },
      })
      return Promise.resolve()
    },
    [],
  )

  const submitQuiz = useCallback(
    async (
      courseId: DefaultDocumentIDType,
      quizId: DefaultDocumentIDType,
      answers: Record<string, unknown>,
    ) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      try {
        const response = await fetch(`${baseAPIURL}/lms/submit-quiz`, {
          body: JSON.stringify({ answers, courseId, quizId }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        if (!response.ok) {
          throw new Error('Failed to submit quiz')
        }
        const data = await response.json()
        if (data.passed) {
          dispatch({
            type: 'SET_QUIZ_COMPLETED',
            payload: { completedAt: new Date().toISOString(), quizId, score: data.score },
          })
        }
        await fetchProgress() // Refetch progress to ensure state is up-to-date
        return data // Return the response data
      } catch (e: unknown) {
        dispatch({
          type: 'SET_ERROR',
          payload: e instanceof Error ? e : new Error('An unknown error occurred'),
        })
        return {
          message: 'An unknown error occurred submitting quiz. Please try again.',
          passed: false,
          score: 0,
        }
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [baseAPIURL, fetchProgress],
  )

  const addUserToGroup = useCallback(
    async (
      groupId: DefaultDocumentIDType,
      memberId: DefaultDocumentIDType,
      role: 'leader' | 'student',
    ) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      try {
        const response = await fetch(`${baseAPIURL}/lms/add-user-to-group`, {
          body: JSON.stringify({ groupId, memberId, role }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        if (!response.ok) {
          throw new Error('Failed to add user to group')
        }
      } catch (e: unknown) {
        dispatch({
          type: 'SET_ERROR',
          payload: e instanceof Error ? e : new Error('An unknown error occurred'),
        })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [baseAPIURL],
  )

  const getProgress = useCallback(
    (courseId: DefaultDocumentIDType, refreshFromDB = false) => {
      if (refreshFromDB) {
        // Fetch fresh progress from database. The caller still gets the progress already in state.
        void fetchProgress()
      }
      return state.progress.find((cp) => {
        // Handle both full course objects and course IDs for backward compatibility
        if (typeof cp.course === 'object' && cp.course !== null) {
          return cp.course.id === courseId
        }
        return cp.course === courseId
      })
    },
    [state.progress, fetchProgress],
  )

  const fetchUsers = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    try {
      const response = await fetch(`${baseAPIURL}/users`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      dispatch({ type: 'SET_USERS', payload: data.docs })
    } catch (e: unknown) {
      dispatch({
        type: 'SET_ERROR',
        payload: e instanceof Error ? e : new Error('An unknown error occurred'),
      })
      dispatch({ type: 'SET_USERS', payload: [] })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [baseAPIURL])

  const fetchCourses = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    try {
      const response = await fetch(`${baseAPIURL}/courses`)
      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }
      const data = await response.json()
      dispatch({ type: 'SET_COURSES', payload: data.docs })
    } catch (e: unknown) {
      dispatch({
        type: 'SET_ERROR',
        payload: e instanceof Error ? e : new Error('An unknown error occurred'),
      })
      dispatch({ type: 'SET_COURSES', payload: [] })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [baseAPIURL])

  const fetchTopics = useCallback(
    async (courseId: DefaultDocumentIDType) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      const query = qs.stringify({ where: { course: { equals: courseId } } })
      try {
        const response = await fetch(`${baseAPIURL}/topics?${query}`)
        if (!response.ok) {
          throw new Error('Failed to fetch topics')
        }
        const data = await response.json()
        dispatch({ type: 'SET_TOPICS', payload: data.docs })
      } catch (e: unknown) {
        dispatch({
          type: 'SET_ERROR',
          payload: e instanceof Error ? e : new Error('An unknown error occurred'),
        })
        dispatch({ type: 'SET_TOPICS', payload: [] })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [baseAPIURL],
  )

  const fetchLessons = useCallback(
    async (topicId: DefaultDocumentIDType) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      const query = qs.stringify({ where: { topic: { equals: topicId } } })
      try {
        const response = await fetch(`${baseAPIURL}/lessons?${query}`)
        if (!response.ok) {
          throw new Error('Failed to fetch lessons')
        }
        const data = await response.json()
        dispatch({ type: 'SET_LESSONS', payload: data.docs })
      } catch (e: unknown) {
        dispatch({
          type: 'SET_ERROR',
          payload: e instanceof Error ? e : new Error('An unknown error occurred'),
        })
        dispatch({ type: 'SET_LESSONS', payload: [] })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [baseAPIURL],
  )

  const fetchQuizzes = useCallback(
    async (lessonId: DefaultDocumentIDType) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      const query = qs.stringify({ where: { lesson: { equals: lessonId } } })
      try {
        const response = await fetch(`${baseAPIURL}/quizzes?${query}`)
        if (!response.ok) {
          throw new Error('Failed to fetch quizzes')
        }
        const data = await response.json()
        dispatch({ type: 'SET_QUIZZES', payload: data.docs })
      } catch (e: unknown) {
        dispatch({
          type: 'SET_ERROR',
          payload: e instanceof Error ? e : new Error('An unknown error occurred'),
        })
        dispatch({ type: 'SET_QUIZZES', payload: [] })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [baseAPIURL],
  )

  const value: LMSContextType = {
    addUserToGroup,
    certificates: state.certificates,
    completeCourse,
    completedCourses: state.completedCourses,
    completeLesson,
    courses: state.courses,
    enroll,
    enrolledCourses: state.enrolledCourses,
    error: state.error,
    fetchCourses,
    fetchLessons,
    fetchProgress,
    fetchQuizzes,
    fetchTopics,
    fetchUsers,
    getProgress,
    isLoading: state.isLoading,
    lessons: state.lessons,
    progress: state.progress,
    quizStarted: state.quizStarted,
    quizzes: state.quizzes,
    setQuizCompleted,
    setQuizExited,
    startQuiz,
    submitQuiz,
    topics: state.topics,
    users: state.users,
  }

  return <LMSContext value={value}>{children}</LMSContext>
}

export const useLMS = (): LMSContextType => {
  const context = use(LMSContext)
  if (context === undefined) {
    throw new Error('useLMS must be used within a LMSProvider')
  }
  return context
}
