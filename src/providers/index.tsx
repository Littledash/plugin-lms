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
  fetchProgress: async () => {},
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

  const fetchProgress = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    try {
      const response = await fetch(`${baseAPIURL}/lms/fetch-progress`)
      if (!response.ok) throw new Error('Failed to fetch user progress')
      const data = await response.json()
      const { coursesProgress, enrolledCourses, completedCourses } = data
      
      // Update all progress-related state
      dispatch({ type: 'UPDATE_PROGRESS', payload: coursesProgress || [] })
      dispatch({ type: 'SET_ENROLLED_COURSES', payload: (enrolledCourses || []).map((course: { id: DefaultDocumentIDType }) => course.id) })
      dispatch({ type: 'SET_COMPLETED_COURSES', payload: (completedCourses || []).map((course: { id: DefaultDocumentIDType }) => course.id) })
    } catch (e: unknown) {
      dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e : new Error('An unknown error occurred') })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [baseAPIURL])

  // Load progress and course status from database on initial render
  useEffect(() => {
    if (syncLocalStorage) {
      // First try to load from localStorage for immediate UI rendering
      const storedProgress = localStorage.getItem(localStorageConfig.key)
      if (storedProgress) {
        const parsed = JSON.parse(storedProgress)
        
        // Normalize progress data to use IDs only for backward compatibility
        const normalizedProgress = (parsed.progress || []).map((progress: any) => ({
          ...progress,
          course: typeof progress.course === 'object' && progress.course !== null ? progress.course.id : progress.course,
          completedLessons: progress.completedLessons?.map((lesson: any) => ({
            ...lesson,
            lesson: typeof lesson.lesson === 'object' && lesson.lesson !== null ? lesson.lesson.id : lesson.lesson,
          })) || [],
          completedQuizzes: progress.completedQuizzes?.map((quiz: any) => ({
            ...quiz,
            quiz: typeof quiz.quiz === 'object' && quiz.quiz !== null ? quiz.quiz.id : quiz.quiz,
          })) || [],
        }))
        
        // Normalize enrolled and completed courses to use IDs only
        const normalizedEnrolledCourses = (parsed.enrolledCourses || []).map((course: any) => 
          typeof course === 'object' && course !== null ? course.id : course
        )
        const normalizedCompletedCourses = (parsed.completedCourses || []).map((course: any) => 
          typeof course === 'object' && course !== null ? course.id : course
        )
        
        dispatch({
          type: 'LOAD_FROM_STORAGE',
          payload: {
            progress: normalizedProgress,
            enrolledCourses: normalizedEnrolledCourses,
            completedCourses: normalizedCompletedCourses,
          },
        })
      }
      
      // Then fetch fresh data from database
      fetchProgress()
    }
  }, [syncLocalStorage, localStorageConfig.key, fetchProgress])

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
        await fetchProgress() // Refetch progress to ensure state is up-to-date
      } catch (e: unknown) {
        dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e : new Error('An unknown error occurred') })
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
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        })
        if (!response.ok) throw new Error('Failed to complete course')
        await fetchProgress() // Refetch progress to ensure state is up-to-date
      } catch (e: unknown) {
        dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e : new Error('An unknown error occurred') })
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
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, lessonId }),
        })
        await fetchProgress() // Refetch progress to ensure state is up-to-date
      } catch (e: unknown) {
        dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e : new Error('An unknown error occurred') })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [baseAPIURL, fetchProgress],
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
        await fetchProgress() // Refetch progress to ensure state is up-to-date
      } catch (e: unknown) {
        dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e : new Error('An unknown error occurred') })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [baseAPIURL, fetchProgress],
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
    (courseId: DefaultDocumentIDType, refreshFromDB = false) => {
      if (refreshFromDB) {
        // Fetch fresh progress from database
        fetchProgress()
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
    fetchProgress,
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
