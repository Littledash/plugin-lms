import type { DefaultDocumentIDType, TypedCollection } from 'payload'
import type React from 'react'



export type LMSUser = TypedCollection['users']
export type Course = TypedCollection['courses']
export type Lesson = {
  course?: Course | DefaultDocumentIDType | null
  topic?: DefaultDocumentIDType | null | Topic
} & TypedCollection['lessons']
export type Quiz = { lesson?: DefaultDocumentIDType | Lesson | null } & TypedCollection['quizzes']
export type Certificate = TypedCollection['certificates']
export type Topic = { course?: Course | DefaultDocumentIDType | null } & TypedCollection['topics']

/**
 * Represents the progress of a user in a specific course.
 */
export type CourseProgress = {
  /** Whether the entire course has been completed. */
  completed: boolean
  /** A list of lessons completed by the user. */
  completedLessons: Array<{
    completedAt: string
    lesson: { id: DefaultDocumentIDType } | DefaultDocumentIDType
  }>
  /** A list of quizzes completed by the user. */
  completedQuizzes: Array<{
    completedAt: string
    quiz: { id: DefaultDocumentIDType } | DefaultDocumentIDType
    score: number
  }>
  /** The completion percentage of the course (0-100). */
  completionPercentage?: number
  /** The course this progress belongs to. */
  course: { id: DefaultDocumentIDType } | DefaultDocumentIDType
  /** The completion of the course (e.g. "1/3"). */
  courseCompletion?: string
}

/**
 * An array of CourseProgress objects, representing a user's progress across all their courses.
 */
export type Progress = CourseProgress[]

/**
 * Defines the shape of the LMS React Context.
 */
export type LMSContextType = {
  /** Adds a user to a group with a specific role. */
  addUserToGroup: (
    groupId: DefaultDocumentIDType,
    memberId: DefaultDocumentIDType,
    role: 'leader' | 'student',
  ) => Promise<void>
  /** A list of certificates earned by the current user. */
  certificates: Certificate[]
  /** Marks a course as complete for the current user. */
  completeCourse: (courseId: DefaultDocumentIDType) => Promise<void>
  /** A list of course IDs the current user has completed. */
    completedCourses: DefaultDocumentIDType[]
  /** Marks a lesson as complete for the current user. */
  completeLesson: (
    courseId: DefaultDocumentIDType,
    lessonId: DefaultDocumentIDType,
  ) => Promise<void>
  /** A list of all courses. */
  courses: Course[]
  /**
   * Enrolls the current user in an open or free course. Paid and group enrollments happen
   * server-side after purchase.
   */
  enroll: (courseId: DefaultDocumentIDType) => Promise<void>
  /** A list of course IDs the current user is enrolled in. */
  enrolledCourses: DefaultDocumentIDType[]
  /** Any error that occurred during data fetching. */
  error: Error | null
    /** Fetches a list of all courses. */
  fetchCourses: () => Promise<void>
  /** Fetches the lessons for a specific topic. */
  fetchLessons: (topicId: DefaultDocumentIDType) => Promise<void>
  /** Fetches the latest progress data from the server. */
  fetchProgress: () => Promise<void>
  /** Fetches the quizzes for a specific lesson. */
  fetchQuizzes: (lessonId: DefaultDocumentIDType) => Promise<void>
  /** Fetches the topics for a specific course. */
  fetchTopics: (courseId: DefaultDocumentIDType) => Promise<void>
  /** Fetches a list of all users. */
  fetchUsers: () => Promise<void>
  /** Gets the progress for a specific course from the local state. */
  getProgress: (courseId: DefaultDocumentIDType) => CourseProgress | undefined
  /** Whether the provider is currently fetching data. */
  isLoading: boolean
  /** A list of lessons for the currently viewed topic. */
  lessons: Lesson[]
  /** The progress of the current user across all courses. */
  progress: Progress
  /** The quiz that the current user is started. */
    quizStarted: {
      courseId: DefaultDocumentIDType | null
      quizId: DefaultDocumentIDType | null
    } | null
  /** A list of quizzes for the currently viewed lesson. */
  quizzes: Quiz[]
  /** Sets a quiz as completed. */
  setQuizCompleted: (quizId: DefaultDocumentIDType, score: number) => Promise<void>
  /** Sets a quiz as exited. */
  setQuizExited: (quizId: DefaultDocumentIDType, courseId: DefaultDocumentIDType) => Promise<void>
  /** Starts a quiz. */
  startQuiz: (quizId: DefaultDocumentIDType, courseId: DefaultDocumentIDType) => Promise<void>
  /** Submits the user's answers for a quiz. */
  submitQuiz: (
    courseId: DefaultDocumentIDType,
    quizId: DefaultDocumentIDType,
    answers: Record<string, unknown>,
  ) => Promise<{
    /** Lessons this pass completed (their quizzes are now all passed). */
    completedLessonIds?: DefaultDocumentIDType[]
    courseCompleted?: boolean
    message: string
    passed: boolean
    score: number
  }>
  /** A list of topics for the currently viewed course. */
  topics: Topic[]
  /** A list of all users. */
  users: LMSUser[]
}

/**
 * Defines the props for the LMSProvider component.
 */
export type LMSProviderProps = {
  /** API configuration for the provider. */
  api?: {
    /** The API route, e.g., '/api'. */
    apiRoute?: string
    /** The base URL of the Payload server. */
    serverURL?: string
  }
  /** The child components to be rendered within the provider. */
  children: React.ReactNode
  /**
   * Whether to sync the user's progress with localStorage.
   * Can be a boolean or an object to override the default localStorage key.
   * @default true
   */
  syncLocalStorage?: boolean
}
