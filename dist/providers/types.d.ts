import type { DefaultDocumentIDType, TypedCollection } from 'payload';
import type React from 'react';
export type LMSUser = TypedCollection['users'];
export type Course = TypedCollection['courses'];
export type Lesson = TypedCollection['lessons'] & {
    topic?: DefaultDocumentIDType | Topic;
    course?: DefaultDocumentIDType | Course;
};
export type Quiz = TypedCollection['quizzes'] & {
    lesson?: DefaultDocumentIDType | Lesson;
};
export type Certificate = TypedCollection['certificates'];
export type Topic = TypedCollection['topics'] & {
    course?: DefaultDocumentIDType | Course;
};
/**
 * Represents the progress of a user in a specific course.
 */
export type CourseProgress = {
    /** The course this progress belongs to. */
    course: DefaultDocumentIDType | {
        id: DefaultDocumentIDType;
    };
    /** Whether the entire course has been completed. */
    completed: boolean;
    /** The completion percentage of the course (0-100). */
    completionPercentage?: number;
    /** The completion of the course (e.g. "1/3"). */
    courseCompletion?: string;
    /** A list of lessons completed by the user. */
    completedLessons: Array<{
        lesson: DefaultDocumentIDType | {
            id: DefaultDocumentIDType;
        };
        completedAt: string;
    }>;
    /** A list of quizzes completed by the user. */
    completedQuizzes: Array<{
        quiz: DefaultDocumentIDType | {
            id: DefaultDocumentIDType;
        };
        score: number;
        completedAt: string;
    }>;
};
/**
 * An array of CourseProgress objects, representing a user's progress across all their courses.
 */
export type Progress = CourseProgress[];
/**
 * Defines the shape of the LMS React Context.
 */
export type LMSContextType = {
    /** A list of all users. */
    users: LMSUser[];
    /** A list of all courses. */
    courses: Course[];
    /** A list of topics for the currently viewed course. */
    topics: Topic[];
    /** A list of lessons for the currently viewed topic. */
    lessons: Lesson[];
    /** The progress of the current user across all courses. */
    progress: Progress;
    /** A list of quizzes for the currently viewed lesson. */
    quizzes: Quiz[];
    /** A list of certificates earned by the current user. */
    certificates: Certificate[];
    /** A list of course IDs the current user is enrolled in. */
    enrolledCourses: DefaultDocumentIDType[];
    /** A list of course IDs the current user has completed. */
    completedCourses: DefaultDocumentIDType[];
    /** The quiz that the current user is started. */
    quizStarted: {
        quizId: DefaultDocumentIDType | null;
        courseId: DefaultDocumentIDType | null;
    } | null;
    /** Enrolls the current user in a course. */
    enroll: (courseId: DefaultDocumentIDType, options?: {
        isGroup?: boolean;
        companyName?: string;
        isLeader?: boolean;
    }) => Promise<void>;
    /** Marks a course as complete for the current user. */
    completeCourse: (courseId: DefaultDocumentIDType) => Promise<void>;
    /** Marks a lesson as complete for the current user. */
    completeLesson: (courseId: DefaultDocumentIDType, lessonId: DefaultDocumentIDType) => Promise<void>;
    /** Submits the user's answers for a quiz. */
    submitQuiz: (courseId: DefaultDocumentIDType, quizId: DefaultDocumentIDType, answers: Record<string, unknown>) => Promise<{
        passed: boolean;
        score: number;
        message: string;
    }>;
    /** Sets a quiz as completed. */
    setQuizCompleted: (quizId: DefaultDocumentIDType, score: number) => Promise<void>;
    /** Sets a quiz as exited. */
    setQuizExited: (quizId: DefaultDocumentIDType, courseId: DefaultDocumentIDType) => Promise<void>;
    /** Adds a user to a group with a specific role. */
    addUserToGroup: (groupId: DefaultDocumentIDType, userId: DefaultDocumentIDType, role: 'leader' | 'student') => Promise<void>;
    /** Gets the progress for a specific course from the local state. */
    getProgress: (courseId: DefaultDocumentIDType) => CourseProgress | undefined;
    /** Fetches the latest progress data from the server. */
    fetchProgress: () => Promise<void>;
    /** Fetches a list of all users. */
    fetchUsers: () => Promise<void>;
    /** Fetches a list of all courses. */
    fetchCourses: () => Promise<void>;
    /** Fetches the topics for a specific course. */
    fetchTopics: (courseId: DefaultDocumentIDType) => Promise<void>;
    /** Fetches the lessons for a specific topic. */
    fetchLessons: (topicId: DefaultDocumentIDType) => Promise<void>;
    /** Fetches the quizzes for a specific lesson. */
    fetchQuizzes: (lessonId: DefaultDocumentIDType) => Promise<void>;
    /** Starts a quiz. */
    startQuiz: (quizId: DefaultDocumentIDType, courseId: DefaultDocumentIDType) => Promise<void>;
    /** Whether the provider is currently fetching data. */
    isLoading: boolean;
    /** Any error that occurred during data fetching. */
    error: Error | null;
};
/**
 * Defines the props for the LMSProvider component.
 */
export type LMSProviderProps = {
    /** The child components to be rendered within the provider. */
    children: React.ReactNode;
    /** API configuration for the provider. */
    api?: {
        /** The base URL of the Payload server. */
        serverURL?: string;
        /** The API route, e.g., '/api'. */
        apiRoute?: string;
    };
    /**
     * Whether to sync the user's progress with localStorage.
     * Can be a boolean or an object to override the default localStorage key.
     * @default true
     */
    syncLocalStorage?: boolean;
};
