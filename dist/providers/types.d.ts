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
export type CourseProgress = {
    course: DefaultDocumentIDType;
    completed: boolean;
    completedLessons: Array<{
        lesson: DefaultDocumentIDType;
        completedAt: string;
    }>;
    completedQuizzes: Array<{
        quiz: DefaultDocumentIDType;
        score: number;
        completedAt: string;
    }>;
};
export type Progress = CourseProgress[];
export type LMSContextType = {
    users: LMSUser[];
    courses: Course[];
    topics: Topic[];
    lessons: Lesson[];
    progress: Progress;
    quizzes: Quiz[];
    certificates: Certificate[];
    enrolledCourses: Course[];
    completedCourses: Course[];
    enroll: (courseId: DefaultDocumentIDType) => Promise<void>;
    completeCourse: (courseId: DefaultDocumentIDType) => Promise<void>;
    completeLesson: (courseId: DefaultDocumentIDType, lessonId: DefaultDocumentIDType) => Promise<void>;
    submitQuiz: (courseId: DefaultDocumentIDType, quizId: DefaultDocumentIDType, answers: Record<string, unknown>) => Promise<void>;
    addUserToGroup: (groupId: DefaultDocumentIDType, userId: DefaultDocumentIDType, role: 'leader' | 'student') => Promise<void>;
    getProgress: (courseId: DefaultDocumentIDType) => CourseProgress | undefined;
    fetchProgress: () => Promise<void>;
    fetchUsers: () => Promise<void>;
    fetchCourses: () => Promise<void>;
    fetchTopics: (courseId: DefaultDocumentIDType) => Promise<void>;
    fetchLessons: (topicId: DefaultDocumentIDType) => Promise<void>;
    fetchQuizzes: (lessonId: DefaultDocumentIDType) => Promise<void>;
    generateCertificate: (courseId: DefaultDocumentIDType) => Promise<void>;
    isLoading: boolean;
    error: Error | null;
};
export type LMSProviderProps = {
    children: React.ReactNode;
    api?: {
        serverURL?: string;
        apiRoute?: string;
    };
    syncLocalStorage?: boolean;
};
