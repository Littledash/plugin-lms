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
  | { type: 'SET_CERTIFICATES'; payload: Certificate[] }
  | { type: 'ENROLL_IN_COURSE'; payload: DefaultDocumentIDType }
  | { type: 'COMPLETE_COURSE'; payload: DefaultDocumentIDType }
  | { type: 'UPDATE_PROGRESS'; payload: CourseProgress[] }
  | { type: 'SET_ENROLLED_COURSES'; payload: DefaultDocumentIDType[] }
  | { type: 'SET_COMPLETED_COURSES'; payload: DefaultDocumentIDType[] }
  | { type: 'ADD_CERTIFICATE'; payload: { id: DefaultDocumentIDType } }
  | { type: 'GENERATE_CERTIFICATE'; payload: { id: DefaultDocumentIDType } }
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

    case 'ADD_CERTIFICATE':
      return {
        ...state,
        certificates: [...state.certificates, action.payload],
      }

    case 'GENERATE_CERTIFICATE':
      return {
        ...state,
        certificates: [...state.certificates, action.payload],
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
