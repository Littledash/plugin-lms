import type { DefaultDocumentIDType } from 'payload';
import type { Certificate, Course, CourseProgress, Lesson, LMSUser, Quiz, Topic } from './types.js';
export type LMSState = {
    certificates: Certificate[];
    completedCourses: DefaultDocumentIDType[];
    courses: Course[];
    enrolledCourses: DefaultDocumentIDType[];
    error: Error | null;
    isLoading: boolean;
    lessons: Lesson[];
    progress: CourseProgress[];
    quizStarted: {
        courseId: DefaultDocumentIDType | null;
        quizId: DefaultDocumentIDType | null;
    } | null;
    quizzes: Quiz[];
    topics: Topic[];
    users: LMSUser[];
};
export type LMSAction = {
    payload: {
        completedAt: string;
        quizId: DefaultDocumentIDType;
        score: number;
    };
    type: 'SET_QUIZ_COMPLETED';
} | {
    payload: {
        completedCourses: DefaultDocumentIDType[];
        enrolledCourses: DefaultDocumentIDType[];
        progress: CourseProgress[];
    };
    type: 'LOAD_FROM_STORAGE';
} | {
    payload: {
        courseId: DefaultDocumentIDType;
        exitedAt: string;
        quizId: DefaultDocumentIDType;
    };
    type: 'SET_QUIZ_EXITED';
} | {
    payload: {
        courseId: DefaultDocumentIDType;
        quizId: DefaultDocumentIDType;
        startedAt: string;
    };
    type: 'SET_QUIZ_STARTED';
} | {
    payload: boolean;
    type: 'SET_LOADING';
} | {
    payload: Certificate[];
    type: 'SET_CERTIFICATES';
} | {
    payload: Course[];
    type: 'SET_COURSES';
} | {
    payload: CourseProgress[];
    type: 'UPDATE_PROGRESS';
} | {
    payload: DefaultDocumentIDType;
    type: 'COMPLETE_COURSE';
} | {
    payload: DefaultDocumentIDType;
    type: 'ENROLL_IN_COURSE';
} | {
    payload: DefaultDocumentIDType[];
    type: 'SET_COMPLETED_COURSES';
} | {
    payload: DefaultDocumentIDType[];
    type: 'SET_ENROLLED_COURSES';
} | {
    payload: Error | null;
    type: 'SET_ERROR';
} | {
    payload: Lesson[];
    type: 'SET_LESSONS';
} | {
    payload: LMSUser[];
    type: 'SET_USERS';
} | {
    payload: Quiz[];
    type: 'SET_QUIZZES';
} | {
    payload: Topic[];
    type: 'SET_TOPICS';
} | {
    type: 'RESET_STATE';
};
export declare const initialState: LMSState;
export declare const lmsReducer: (state: LMSState, action: LMSAction) => LMSState;
