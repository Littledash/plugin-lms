'use client'

import React, { createContext, use, useCallback, useEffect, useReducer } from 'react'
import type { DefaultDocumentIDType } from 'payload'
import * as qs from 'qs-esm'
import { LMSContextType, LMSProviderProps } from './types.js'
import { lmsReducer, initialState, type LMSState } from './reducer.js'

const defaultContext: LMSContextType = {
  users: [],
  courses: [],
  topics: [],
  lessons: [],
  progress: [],
  quizzes: [],
  certificates: [],
  enrolledCourses: [],
  completedCourses: [],
  enroll: async () => {},
  completeCourse: async () => {},
  completeLesson: async () => {},
  submitQuiz: async () => {},
  addUserToGroup: async () => {},
  getProgress: () => undefined,
  fetchUsers: async () => {},
  fetchCourses: async () => {},
  fetchTopics: async () => {},
  fetchLessons: async () => {},
  fetchQuizzes: async () => {},
  generateCertificate: async () => {},
  isLoading: false,
  error: null,
}

const LMSContext = createContext<LMSContextType>(defaultContext)

const defaultLocalStorage = {
  key: 'lms',
}

export const LMSProvider: React.FC<LMSProviderProps> = ({
  children,
  api,
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

  // Load progress and course status from localStorage on initial render
  useEffect(() => {
    if (syncLocalStorage) {
      const storedProgress = localStorage.getItem(localStorageConfig.key)
      if (storedProgress) {
        const parsed = JSON.parse(storedProgress)
        dispatch({
          type: 'LOAD_FROM_STORAGE',
          payload: {
            progress: parsed.progress || [],
            enrolledCourses: parsed.enrolledCourses || [],
            completedCourses: parsed.completedCourses || [],
          },
        })
      }
    }
  }, [syncLocalStorage, localStorageConfig.key])

  // Persist progress and course status to localStorage whenever they change
  useEffect(() => {
    if (syncLocalStorage) {
      const serializedState = JSON.stringify({
        progress: state.progress,
        enrolledCourses: state.enrolledCourses,
        completedCourses: state.completedCourses,
      })
      localStorage.setItem(localStorageConfig.key, serializedState)
    }
  }, [state.progress, state.enrolledCourses, state.completedCourses, syncLocalStorage, localStorageConfig.key])

  const enroll = useCallback(
    async (courseId: DefaultDocumentIDType) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      try {
        const response = await fetch(`${baseAPIURL}/lms/enroll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        })
        if (!response.ok) throw new Error('Failed to enroll in course')
        const enrolledCourse = state.courses.find((course) => course.id === courseId)
        if (enrolledCourse) {
                  dispatch({ type: 'ENROLL_IN_COURSE', payload: enrolledCourse })
      }
    } catch (e: unknown) {
      dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e : new Error('An unknown error occurred') })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  },
  [baseAPIURL, state.courses],
)

  const completeCourse = useCallback(
    async (courseId: DefaultDocumentIDType) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      try {
        const response = await fetch(`${baseAPIURL}/lms/complete-course`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        })
        if (!response.ok) throw new Error('Failed to complete course')
        const courseToComplete = state.enrolledCourses.find((course) => course.id === courseId)
        if (courseToComplete) {
          dispatch({ 
            type: 'COMPLETE_COURSE', 
            payload: { courseId, course: courseToComplete } 
          })
        }
      } catch (e: unknown) {
        dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e : new Error('An unknown error occurred') })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [baseAPIURL, state.enrolledCourses],
  )

  const completeLesson = useCallback(
    async (courseId: DefaultDocumentIDType, lessonId: DefaultDocumentIDType) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      try {
        await fetch(`${baseAPIURL}/lms/complete-lesson`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, lessonId }),
        })
        // Progress is now handled by the API endpoint
      } catch (e: unknown) {
        dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e : new Error('An unknown error occurred') })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [baseAPIURL],
  )

  const submitQuiz = useCallback(
    async (courseId: DefaultDocumentIDType, quizId: DefaultDocumentIDType, answers: Record<string, unknown>) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      try {
        const response = await fetch(`${baseAPIURL}/lms/submit-quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, quizId, answers }),
        })
        if (!response.ok) throw new Error('Failed to submit quiz')
        const { score } = await response.json()
        // Progress is now handled by the API endpoint
      } catch (e: unknown) {
        dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e : new Error('An unknown error occurred') })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [baseAPIURL],
  )

  const addUserToGroup = useCallback(
    async (groupId: DefaultDocumentIDType, userId: DefaultDocumentIDType, role: 'leader' | 'student') => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      try {
        const response = await fetch(`${baseAPIURL}/lms/add-user-to-group`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupId, userId, role }),
        })
        if (!response.ok) throw new Error('Failed to add user to group')
      } catch (e: unknown) {
        dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e : new Error('An unknown error occurred') })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [baseAPIURL],
  )

  const getProgress = useCallback(
    (courseId: DefaultDocumentIDType) => {
      return state.progress.find((cp) => cp.course === courseId)
    },
    [state.progress],
  )

  const fetchUsers = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    try {
      const response = await fetch(`${baseAPIURL}/users`)
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      dispatch({ type: 'SET_USERS', payload: data.docs })
    } catch (e: unknown) {
      dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e : new Error('An unknown error occurred') })
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
      if (!response.ok) throw new Error('Failed to fetch courses')
      const data = await response.json()
      dispatch({ type: 'SET_COURSES', payload: data.docs })
    } catch (e: unknown) {
      dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e : new Error('An unknown error occurred') })
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
        if (!response.ok) throw new Error('Failed to fetch topics')
        const data = await response.json()
        dispatch({ type: 'SET_TOPICS', payload: data.docs })
      } catch (e: unknown) {
        dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e : new Error('An unknown error occurred') })
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
        if (!response.ok) throw new Error('Failed to fetch lessons')
        const data = await response.json()
        dispatch({ type: 'SET_LESSONS', payload: data.docs })
      } catch (e: unknown) {
        dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e : new Error('An unknown error occurred') })
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
        if (!response.ok) throw new Error('Failed to fetch quizzes')
        const data = await response.json()
        dispatch({ type: 'SET_QUIZZES', payload: data.docs })
      } catch (e: unknown) {
        dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e : new Error('An unknown error occurred') })
        dispatch({ type: 'SET_QUIZZES', payload: [] })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [baseAPIURL],
  )

  const generateCertificate = useCallback(
    async (courseId: DefaultDocumentIDType) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      try {
        const response = await fetch(`${baseAPIURL}/lms/generate-certificate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        })
        if (!response.ok) throw new Error('Failed to generate certificate')
        const newCertificate = await response.json()
        dispatch({ type: 'ADD_CERTIFICATE', payload: newCertificate })
      } catch (e: unknown) {
        dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e : new Error('An unknown error occurred') })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [baseAPIURL],
  )

  const value: LMSContextType = {
    users: state.users,
    courses: state.courses,
    topics: state.topics,
    lessons: state.lessons,
    progress: state.progress,
    quizzes: state.quizzes,
    certificates: state.certificates,
    enrolledCourses: state.enrolledCourses,
    completedCourses: state.completedCourses,
    enroll,
    completeCourse,
    completeLesson,
    submitQuiz,
    addUserToGroup,
    getProgress,
    fetchUsers,
    fetchCourses,
    fetchTopics,
    fetchLessons,
    fetchQuizzes,
    generateCertificate,
    isLoading: state.isLoading,
    error: state.error,
  }

  return <LMSContext.Provider value={value}>{children}</LMSContext.Provider>
}

export const useLMS = (): LMSContextType => {
  const context = use(LMSContext)
  if (context === undefined) {
    throw new Error('useLMS must be used within a LMSProvider')
  }
  return context
}
