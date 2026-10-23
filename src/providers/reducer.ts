import type { DefaultDocumentIDType } from 'payload'

import type { Certificate, Course, CourseProgress, Lesson, LMSUser, Quiz, Topic } from './types.js'

export type LMSState = {
  certificates: Certificate[]
  completedCourses: DefaultDocumentIDType[]
  courses: Course[]
  enrolledCourses: DefaultDocumentIDType[]
  error: Error | null
  isLoading: boolean
  lessons: Lesson[]
  progress: CourseProgress[]
  quizStarted: {
    courseId: DefaultDocumentIDType | null
    quizId: DefaultDocumentIDType | null
  } | null
  quizzes: Quiz[]
  topics: Topic[]
  users: LMSUser[]
}

export type LMSAction =
  | { payload: {
    completedAt: string
    quizId: DefaultDocumentIDType
    score: number
  }; type: 'SET_QUIZ_COMPLETED' }
  | { payload: { completedCourses: DefaultDocumentIDType[]; enrolledCourses: DefaultDocumentIDType[]; progress: CourseProgress[] }; type: 'LOAD_FROM_STORAGE' }
  | { payload: {
    courseId: DefaultDocumentIDType
    exitedAt: string
    quizId: DefaultDocumentIDType

  }; type: 'SET_QUIZ_EXITED' }
  | { payload: {
    courseId: DefaultDocumentIDType
    quizId: DefaultDocumentIDType
    startedAt: string
  }; type: 'SET_QUIZ_STARTED' }
  | { payload: boolean; type: 'SET_LOADING' }
  | { payload: Certificate[]; type: 'SET_CERTIFICATES' }
  | { payload: Course[]; type: 'SET_COURSES' }
  | { payload: CourseProgress[]; type: 'UPDATE_PROGRESS' }
  | { payload: DefaultDocumentIDType; type: 'COMPLETE_COURSE' }
  | { payload: DefaultDocumentIDType; type: 'ENROLL_IN_COURSE' }
  | { payload: DefaultDocumentIDType[]; type: 'SET_COMPLETED_COURSES' }
  | { payload: DefaultDocumentIDType[]; type: 'SET_ENROLLED_COURSES' }
  | { payload: Error | null; type: 'SET_ERROR' }
  | { payload: Lesson[]; type: 'SET_LESSONS' }
  | { payload: LMSUser[]; type: 'SET_USERS' }
  | { payload: Quiz[]; type: 'SET_QUIZZES' }
  | { payload: Topic[]; type: 'SET_TOPICS' }
  | { type: 'RESET_STATE' }

export const initialState: LMSState = {
  certificates: [],
  completedCourses: [],
  courses: [],
  enrolledCourses: [],
  error: null,
  isLoading: false,
  lessons: [],
  progress: [],
  quizStarted:  null,
  quizzes: [],
  topics: [],
  users: [],
}

export const lmsReducer = (state: LMSState, action: LMSAction): LMSState => {
  switch (action.type) {
    case 'COMPLETE_COURSE':
      return {
        ...state,
        completedCourses: [...state.completedCourses, action.payload],
        enrolledCourses: state.enrolledCourses.filter((courseId) => courseId !== action.payload),
      }

    case 'ENROLL_IN_COURSE':
      return {
        ...state,
        enrolledCourses: [...state.enrolledCourses, action.payload],
      }

    case 'LOAD_FROM_STORAGE':
      return {
        ...state,
        completedCourses: action.payload.completedCourses,
        enrolledCourses: action.payload.enrolledCourses,
        progress: action.payload.progress,
      }

    case 'RESET_STATE':
      return initialState

    case 'SET_CERTIFICATES':
      return {
        ...state,
        certificates: action.payload,
      }

    case 'SET_COMPLETED_COURSES':
      return {
        ...state,
        completedCourses: action.payload,
      }

    case 'SET_COURSES':
      return {
        ...state,
        courses: action.payload,
      }

    case 'SET_ENROLLED_COURSES':
      return {
        ...state,
        enrolledCourses: action.payload,
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      }

    case 'SET_LESSONS':
      return {
        ...state,
        lessons: action.payload,
      }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }

    case 'SET_QUIZ_COMPLETED':
      return {
        ...state,
        quizStarted: null,
        quizzes: state.quizzes.map((quiz) => quiz.id === action.payload.quizId ? { ...quiz, completedAt: action.payload.completedAt, score: action.payload.score } : quiz),
      }

    case 'SET_QUIZ_EXITED':
      return {
        ...state,
        quizStarted: null,
        quizzes: state.quizzes.map((quiz) => quiz.id === action.payload.quizId ? { ...quiz, exitedAt: action.payload.exitedAt } : quiz),
      }

    case 'SET_QUIZ_STARTED':
      return {
        ...state,
        isLoading: false,
        quizStarted: {
          courseId: action.payload.courseId,
          quizId: action.payload.quizId,
        },
        quizzes: state.quizzes.map((quiz) => quiz.id === action.payload.quizId ? { ...quiz, startedAt: action.payload.startedAt } : quiz),
      }
      
    case 'SET_QUIZZES':
      return {
        ...state,
        quizzes: action.payload,
      }

    case 'SET_TOPICS':
      return {
        ...state,
        topics: action.payload,
      }


    case 'SET_USERS':
      return {
        ...state,
        users: action.payload,
      }

    case 'UPDATE_PROGRESS':
      return {
        ...state,
        progress: action.payload,
      }

    default:
      return state
  }
}
