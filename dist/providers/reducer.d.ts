import type { DefaultDocumentIDType } from 'payload';
import type { LMSUser, Course, Topic, Lesson, Quiz, Certificate, CourseProgress } from './types.js';
export type LMSState = {
    users: LMSUser[];
    courses: Course[];
    topics: Topic[];
    lessons: Lesson[];
    progress: CourseProgress[];
    quizzes: Quiz[];
    certificates: Certificate[];
    enrolledCourses: DefaultDocumentIDType[];
    completedCourses: DefaultDocumentIDType[];
    quizStarted: DefaultDocumentIDType | null;
    isLoading: boolean;
    error: Error | null;
};
export type LMSAction = {
    type: 'SET_LOADING';
    payload: boolean;
} | {
    type: 'SET_ERROR';
    payload: Error | null;
} | {
    type: 'SET_USERS';
    payload: LMSUser[];
} | {
    type: 'SET_COURSES';
    payload: Course[];
} | {
    type: 'SET_TOPICS';
    payload: Topic[];
} | {
    type: 'SET_LESSONS';
    payload: Lesson[];
} | {
    type: 'SET_QUIZZES';
    payload: Quiz[];
} | {
    type: 'SET_QUIZ_STARTED';
    payload: {
        quizId: DefaultDocumentIDType;
        startedAt: string;
    };
} | {
    type: 'SET_QUIZ_EXITED';
    payload: {
        quizId: DefaultDocumentIDType;
        exitedAt: string;
    };
} | {
    type: 'SET_QUIZ_COMPLETED';
    payload: {
        quizId: DefaultDocumentIDType;
        completedAt: string;
        score: number;
    };
} | {
    type: 'SET_CERTIFICATES';
    payload: Certificate[];
} | {
    type: 'ENROLL_IN_COURSE';
    payload: DefaultDocumentIDType;
} | {
    type: 'COMPLETE_COURSE';
    payload: DefaultDocumentIDType;
} | {
    type: 'UPDATE_PROGRESS';
    payload: CourseProgress[];
} | {
    type: 'SET_ENROLLED_COURSES';
    payload: DefaultDocumentIDType[];
} | {
    type: 'SET_COMPLETED_COURSES';
    payload: DefaultDocumentIDType[];
} | {
    type: 'LOAD_FROM_STORAGE';
    payload: {
        progress: CourseProgress[];
        enrolledCourses: DefaultDocumentIDType[];
        completedCourses: DefaultDocumentIDType[];
    };
} | {
    type: 'RESET_STATE';
};
export declare const initialState: LMSState;
export declare const lmsReducer: (state: LMSState, action: LMSAction) => LMSState;
