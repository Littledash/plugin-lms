import type { DefaultDocumentIDType } from 'payload'
import type { LMSUser, Course, Topic, Lesson, Quiz, Certificate, CourseProgress } from './types.js'

export type LMSState = {
  users: LMSUser[]
  courses: Course[]
  topics: Topic[]
  lessons: Lesson[]
  progress: CourseProgress[]
  quizzes: Quiz[]
  certificates: Certificate[]
  enrolledCourses: DefaultDocumentIDType[]
  completedCourses: DefaultDocumentIDType[]
  quizStarted: DefaultDocumentIDType | null
  isLoading: boolean
  error: Error | null
}

export type LMSAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'SET_USERS'; payload: LMSUser[] }
  | { type: 'SET_COURSES'; payload: Course[] }
  | { type: 'SET_TOPICS'; payload: Topic[] }
  | { type: 'SET_LESSONS'; payload: Lesson[] }
  | { type: 'SET_QUIZZES'; payload: Quiz[] }
  | { type: 'SET_QUIZ_STARTED'; payload: {
    quizId: DefaultDocumentIDType
    startedAt: string
    quizStarted: DefaultDocumentIDType | null
  } }
  | { type: 'SET_QUIZ_EXITED'; payload: {
    quizId: DefaultDocumentIDType
    exitedAt: string
    quizStarted: DefaultDocumentIDType | null
  } }
  | { type: 'SET_QUIZ_COMPLETED'; payload: {
    quizId: DefaultDocumentIDType
    completedAt: string
    score: number
    quizStarted: DefaultDocumentIDType | null
  } }
  | { type: 'SET_CERTIFICATES'; payload: Certificate[] }
  | { type: 'ENROLL_IN_COURSE'; payload: DefaultDocumentIDType }
  | { type: 'COMPLETE_COURSE'; payload: DefaultDocumentIDType }
  | { type: 'UPDATE_PROGRESS'; payload: CourseProgress[] }
  | { type: 'SET_ENROLLED_COURSES'; payload: DefaultDocumentIDType[] }
  | { type: 'SET_COMPLETED_COURSES'; payload: DefaultDocumentIDType[] }
  | { type: 'LOAD_FROM_STORAGE'; payload: { progress: CourseProgress[]; enrolledCourses: DefaultDocumentIDType[]; completedCourses: DefaultDocumentIDType[] } }
  | { type: 'RESET_STATE' }

export const initialState: LMSState = {
  users: [],
  courses: [],
  topics: [],
  lessons: [],
  progress: [],
  quizzes: [],
  certificates: [],
  enrolledCourses: [],
  completedCourses: [],
  quizStarted: null,
  isLoading: false,
  error: null,
}

export const lmsReducer = (state: LMSState, action: LMSAction): LMSState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      }

    case 'SET_USERS':
      return {
        ...state,
        users: action.payload,
      }

    case 'SET_COURSES':
      return {
        ...state,
        courses: action.payload,
      }

    case 'SET_TOPICS':
      return {
        ...state,
        topics: action.payload,
      }

    case 'SET_LESSONS':
      return {
        ...state,
        lessons: action.payload,
      }

    case 'SET_QUIZZES':
      return {
        ...state,
        quizzes: action.payload,
      }

    case 'SET_CERTIFICATES':
      return {
        ...state,
        certificates: action.payload,
      }

    case 'ENROLL_IN_COURSE':
      return {
        ...state,
        enrolledCourses: [...state.enrolledCourses, action.payload],
      }

    case 'COMPLETE_COURSE':
      return {
        ...state,
        enrolledCourses: state.enrolledCourses.filter((courseId) => courseId !== action.payload),
        completedCourses: [...state.completedCourses, action.payload],
      }

    case 'UPDATE_PROGRESS':
      return {
        ...state,
        progress: action.payload,
      }

    case 'SET_ENROLLED_COURSES':
      return {
        ...state,
        enrolledCourses: action.payload,
      }

    case 'SET_COMPLETED_COURSES':
      return {
        ...state,
        completedCourses: action.payload,
      }

    case 'SET_QUIZ_STARTED':
      return {
        ...state,
        quizzes: state.quizzes.map((quiz) => quiz.id === action.payload.quizId ? { ...quiz, startedAt: action.payload.startedAt } : quiz),
        quizStarted: action.payload.quizId,
        isLoading: false,
      }
      
    case 'SET_QUIZ_COMPLETED':
      return {
        ...state,
        quizzes: state.quizzes.map((quiz) => quiz.id === action.payload.quizId ? { ...quiz, completedAt: action.payload.completedAt, score: action.payload.score } : quiz),
      }

    case 'SET_QUIZ_EXITED':
      return {
        ...state,
        quizzes: state.quizzes.map((quiz) => quiz.id === action.payload.quizId ? { ...quiz, exitedAt: action.payload.exitedAt } : quiz),
        quizStarted: null,
      }


    case 'LOAD_FROM_STORAGE':
      return {
        ...state,
        progress: action.payload.progress,
        enrolledCourses: action.payload.enrolledCourses,
        completedCourses: action.payload.completedCourses,
      }

    case 'RESET_STATE':
      return initialState

    default:
      return state
  }
}
