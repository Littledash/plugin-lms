'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import * as qs from 'qs-esm';
import React, { createContext, use, useCallback, useEffect, useReducer } from 'react';
import { initialState, lmsReducer } from './reducer.js';
const defaultContext = {
    addUserToGroup: async ()=>{},
    certificates: [],
    completeCourse: async ()=>{},
    completedCourses: [],
    completeLesson: async ()=>{},
    courses: [],
    enroll: async ()=>{},
    enrolledCourses: [],
    error: null,
    fetchCourses: async ()=>{},
    fetchLessons: async ()=>{},
    fetchProgress: async ()=>{},
    fetchQuizzes: async ()=>{},
    fetchTopics: async ()=>{},
    fetchUsers: async ()=>{},
    getProgress: ()=>undefined,
    isLoading: false,
    lessons: [],
    progress: [],
    quizStarted: null,
    quizzes: [],
    setQuizCompleted: async ()=>{},
    setQuizExited: async ()=>{},
    startQuiz: async ()=>{},
    submitQuiz: ()=>Promise.resolve({
            message: 'An unknown error occurred submitting quiz. Please try again.',
            passed: false,
            score: 0
        }),
    topics: [],
    users: []
};
const LMSContext = /*#__PURE__*/ createContext(defaultContext);
const defaultLocalStorage = {
    key: 'lms'
};
export const LMSProvider = ({ api, children, syncLocalStorage = true })=>{
    const localStorageConfig = syncLocalStorage && typeof syncLocalStorage === 'object' ? {
        ...defaultLocalStorage,
        ...syncLocalStorage
    } : defaultLocalStorage;
    const { apiRoute = '/api', serverURL = '' } = api || {};
    const baseAPIURL = `${serverURL}${apiRoute}`;
    const [state, dispatch] = useReducer(lmsReducer, initialState);
    const getUser = useCallback(async ()=>{
        try {
            const response = await fetch(`${baseAPIURL}/users/me`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'GET'
            });
            // Handle 401 (Unauthorized) - user is not logged in, this is expected
            if (response.status === 401) {
                return null;
            }
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch user: ${errorText}`);
            }
            const userData = await response.json();
            if (userData.error) {
                throw new Error(`User fetch error: ${userData.error}`);
            }
            if (userData.user) {
                return userData.user;
            }
            return null;
        } catch (error) {
            // Only throw if it's not a 401 (which we already handled)
            throw new Error(`Failed to fetch user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [
        baseAPIURL
    ]);
    const fetchProgress = useCallback(async ()=>{
        dispatch({
            type: 'SET_LOADING',
            payload: true
        });
        dispatch({
            type: 'SET_ERROR',
            payload: null
        });
        try {
            // Check if user is logged in first
            const currentUser = await getUser();
            // If no user is logged in, reset progress and return early
            if (!currentUser) {
                dispatch({
                    type: 'UPDATE_PROGRESS',
                    payload: []
                });
                dispatch({
                    type: 'SET_ENROLLED_COURSES',
                    payload: []
                });
                dispatch({
                    type: 'SET_COMPLETED_COURSES',
                    payload: []
                });
                return;
            }
            // User is logged in, fetch progress
            const response = await fetch(`${baseAPIURL}/lms/fetch-progress`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'GET'
            });
            if (!response.ok) {
                throw new Error('Failed to fetch user progress');
            }
            const data = await response.json();
            const { completedCourses, coursesProgress, enrolledCourses } = data;
            // Update all progress-related state
            dispatch({
                type: 'UPDATE_PROGRESS',
                payload: coursesProgress || []
            });
            // Ensure enrolledCourses is an array before mapping
            const enrolledCoursesArray = Array.isArray(enrolledCourses) ? enrolledCourses : [];
            dispatch({
                type: 'SET_ENROLLED_COURSES',
                payload: enrolledCoursesArray.map((course)=>course.id)
            });
            // Ensure completedCourses is an array before mapping
            const completedCoursesArray = Array.isArray(completedCourses) ? completedCourses : [];
            dispatch({
                type: 'SET_COMPLETED_COURSES',
                payload: completedCoursesArray.map((course)=>course.id)
            });
        } catch (e) {
            dispatch({
                type: 'SET_ERROR',
                payload: e instanceof Error ? e : new Error('An unknown error occurred')
            });
        } finally{
            dispatch({
                type: 'SET_LOADING',
                payload: false
            });
        }
    }, [
        baseAPIURL,
        getUser
    ]);
    // Load progress and course status from database on initial render
    useEffect(()=>{
        if (syncLocalStorage) {
            // First try to load from localStorage for immediate UI rendering
            const storedProgress = localStorage.getItem(localStorageConfig.key);
            if (storedProgress) {
                const parsed = JSON.parse(storedProgress);
                // Normalize progress data to use IDs only for backward compatibility
                const normalizedProgress = (parsed.progress || []).map((progress)=>({
                        ...progress,
                        completedLessons: progress.completedLessons?.map((lesson)=>({
                                ...lesson,
                                lesson: typeof lesson.lesson === 'object' && lesson.lesson !== null ? lesson.lesson.id : lesson.lesson
                            })) || [],
                        completedQuizzes: progress.completedQuizzes?.map((quiz)=>({
                                ...quiz,
                                quiz: typeof quiz.quiz === 'object' && quiz.quiz !== null ? quiz.quiz.id : quiz.quiz
                            })) || [],
                        completionPercentage: progress.completionPercentage || 0,
                        course: typeof progress.course === 'object' && progress.course !== null ? progress.course.id : progress.course,
                        courseCompletion: progress.courseCompletion || ''
                    }));
                // Normalize enrolled and completed courses to use IDs only
                const normalizedEnrolledCourses = (parsed.enrolledCourses || []).map((course)=>typeof course === 'object' && course !== null ? course.id : course);
                const normalizedCompletedCourses = (parsed.completedCourses || []).map((course)=>typeof course === 'object' && course !== null ? course.id : course);
                dispatch({
                    type: 'LOAD_FROM_STORAGE',
                    payload: {
                        completedCourses: normalizedCompletedCourses,
                        enrolledCourses: normalizedEnrolledCourses,
                        progress: normalizedProgress
                    }
                });
            }
            // Then fetch fresh data from database. The effect must not wait on it.
            void fetchProgress();
        }
    }, [
        syncLocalStorage,
        localStorageConfig.key,
        fetchProgress
    ]);
    // Persist progress and course status to localStorage whenever they change
    useEffect(()=>{
        if (syncLocalStorage) {
            const serializedState = JSON.stringify({
                completedCourses: state.completedCourses,
                enrolledCourses: state.enrolledCourses,
                progress: state.progress
            });
            localStorage.setItem(localStorageConfig.key, serializedState);
        }
    }, [
        state.progress,
        state.enrolledCourses,
        state.completedCourses,
        syncLocalStorage,
        localStorageConfig.key
    ]);
    const enroll = useCallback(async (courseId)=>{
        dispatch({
            type: 'SET_LOADING',
            payload: true
        });
        dispatch({
            type: 'SET_ERROR',
            payload: null
        });
        try {
            const response = await fetch(`${baseAPIURL}/lms/enroll`, {
                body: JSON.stringify({
                    courseId
                }),
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST'
            });
            if (!response.ok) {
                throw new Error('Failed to enroll in course');
            }
            await fetchProgress() // Refetch progress to ensure state is up-to-date
            ;
        } catch (e) {
            dispatch({
                type: 'SET_ERROR',
                payload: e instanceof Error ? e : new Error('An unknown error occurred')
            });
        } finally{
            dispatch({
                type: 'SET_LOADING',
                payload: false
            });
        }
    }, [
        baseAPIURL,
        fetchProgress
    ]);
    const completeCourse = useCallback(async (courseId)=>{
        dispatch({
            type: 'SET_LOADING',
            payload: true
        });
        dispatch({
            type: 'SET_ERROR',
            payload: null
        });
        try {
            const response = await fetch(`${baseAPIURL}/lms/complete-course`, {
                body: JSON.stringify({
                    courseId
                }),
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST'
            });
            if (!response.ok) {
                throw new Error('Failed to complete course');
            }
            await fetchProgress() // Refetch progress to ensure state is up-to-date
            ;
        } catch (e) {
            dispatch({
                type: 'SET_ERROR',
                payload: e instanceof Error ? e : new Error('An unknown error occurred')
            });
        } finally{
            dispatch({
                type: 'SET_LOADING',
                payload: false
            });
        }
    }, [
        baseAPIURL,
        fetchProgress
    ]);
    const completeLesson = useCallback(async (courseId, lessonId)=>{
        dispatch({
            type: 'SET_LOADING',
            payload: true
        });
        dispatch({
            type: 'SET_ERROR',
            payload: null
        });
        try {
            await fetch(`${baseAPIURL}/lms/complete-lesson`, {
                body: JSON.stringify({
                    courseId,
                    lessonId
                }),
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST'
            });
            await fetchProgress() // Refetch progress to ensure state is up-to-date
            ;
        } catch (e) {
            dispatch({
                type: 'SET_ERROR',
                payload: e instanceof Error ? e : new Error('An unknown error occurred')
            });
        } finally{
            dispatch({
                type: 'SET_LOADING',
                payload: false
            });
        }
    }, [
        baseAPIURL,
        fetchProgress
    ]);
    const startQuiz = useCallback((quizId, courseId)=>{
        dispatch({
            type: 'SET_LOADING',
            payload: true
        });
        dispatch({
            type: 'SET_ERROR',
            payload: null
        });
        dispatch({
            type: 'SET_QUIZ_STARTED',
            payload: {
                courseId,
                quizId,
                startedAt: new Date().toISOString()
            }
        });
        return Promise.resolve();
    }, []);
    const setQuizCompleted = useCallback((quizId, score)=>{
        dispatch({
            type: 'SET_QUIZ_COMPLETED',
            payload: {
                completedAt: new Date().toISOString(),
                quizId,
                score
            }
        });
        return Promise.resolve();
    }, []);
    const setQuizExited = useCallback((quizId, courseId)=>{
        dispatch({
            type: 'SET_QUIZ_EXITED',
            payload: {
                courseId,
                exitedAt: new Date().toISOString(),
                quizId
            }
        });
        return Promise.resolve();
    }, []);
    const submitQuiz = useCallback(async (courseId, quizId, answers)=>{
        dispatch({
            type: 'SET_LOADING',
            payload: true
        });
        dispatch({
            type: 'SET_ERROR',
            payload: null
        });
        try {
            const response = await fetch(`${baseAPIURL}/lms/submit-quiz`, {
                body: JSON.stringify({
                    answers,
                    courseId,
                    quizId
                }),
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST'
            });
            if (!response.ok) {
                throw new Error('Failed to submit quiz');
            }
            const data = await response.json();
            if (data.passed) {
                dispatch({
                    type: 'SET_QUIZ_COMPLETED',
                    payload: {
                        completedAt: new Date().toISOString(),
                        quizId,
                        score: data.score
                    }
                });
            }
            await fetchProgress() // Refetch progress to ensure state is up-to-date
            ;
            return data // Return the response data
            ;
        } catch (e) {
            dispatch({
                type: 'SET_ERROR',
                payload: e instanceof Error ? e : new Error('An unknown error occurred')
            });
            return {
                message: 'An unknown error occurred submitting quiz. Please try again.',
                passed: false,
                score: 0
            };
        } finally{
            dispatch({
                type: 'SET_LOADING',
                payload: false
            });
        }
    }, [
        baseAPIURL,
        fetchProgress
    ]);
    const addUserToGroup = useCallback(async (groupId, memberId, role)=>{
        dispatch({
            type: 'SET_LOADING',
            payload: true
        });
        dispatch({
            type: 'SET_ERROR',
            payload: null
        });
        try {
            const response = await fetch(`${baseAPIURL}/lms/add-user-to-group`, {
                body: JSON.stringify({
                    groupId,
                    memberId,
                    role
                }),
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST'
            });
            if (!response.ok) {
                throw new Error('Failed to add user to group');
            }
        } catch (e) {
            dispatch({
                type: 'SET_ERROR',
                payload: e instanceof Error ? e : new Error('An unknown error occurred')
            });
        } finally{
            dispatch({
                type: 'SET_LOADING',
                payload: false
            });
        }
    }, [
        baseAPIURL
    ]);
    const getProgress = useCallback((courseId, refreshFromDB = false)=>{
        if (refreshFromDB) {
            // Fetch fresh progress from database. The caller still gets the progress already in state.
            void fetchProgress();
        }
        return state.progress.find((cp)=>{
            // Handle both full course objects and course IDs for backward compatibility
            if (typeof cp.course === 'object' && cp.course !== null) {
                return cp.course.id === courseId;
            }
            return cp.course === courseId;
        });
    }, [
        state.progress,
        fetchProgress
    ]);
    const fetchUsers = useCallback(async ()=>{
        dispatch({
            type: 'SET_LOADING',
            payload: true
        });
        dispatch({
            type: 'SET_ERROR',
            payload: null
        });
        try {
            const response = await fetch(`${baseAPIURL}/users`);
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            const data = await response.json();
            dispatch({
                type: 'SET_USERS',
                payload: data.docs
            });
        } catch (e) {
            dispatch({
                type: 'SET_ERROR',
                payload: e instanceof Error ? e : new Error('An unknown error occurred')
            });
            dispatch({
                type: 'SET_USERS',
                payload: []
            });
        } finally{
            dispatch({
                type: 'SET_LOADING',
                payload: false
            });
        }
    }, [
        baseAPIURL
    ]);
    const fetchCourses = useCallback(async ()=>{
        dispatch({
            type: 'SET_LOADING',
            payload: true
        });
        dispatch({
            type: 'SET_ERROR',
            payload: null
        });
        try {
            const response = await fetch(`${baseAPIURL}/courses`);
            if (!response.ok) {
                throw new Error('Failed to fetch courses');
            }
            const data = await response.json();
            dispatch({
                type: 'SET_COURSES',
                payload: data.docs
            });
        } catch (e) {
            dispatch({
                type: 'SET_ERROR',
                payload: e instanceof Error ? e : new Error('An unknown error occurred')
            });
            dispatch({
                type: 'SET_COURSES',
                payload: []
            });
        } finally{
            dispatch({
                type: 'SET_LOADING',
                payload: false
            });
        }
    }, [
        baseAPIURL
    ]);
    const fetchTopics = useCallback(async (courseId)=>{
        dispatch({
            type: 'SET_LOADING',
            payload: true
        });
        dispatch({
            type: 'SET_ERROR',
            payload: null
        });
        const query = qs.stringify({
            where: {
                course: {
                    equals: courseId
                }
            }
        });
        try {
            const response = await fetch(`${baseAPIURL}/topics?${query}`);
            if (!response.ok) {
                throw new Error('Failed to fetch topics');
            }
            const data = await response.json();
            dispatch({
                type: 'SET_TOPICS',
                payload: data.docs
            });
        } catch (e) {
            dispatch({
                type: 'SET_ERROR',
                payload: e instanceof Error ? e : new Error('An unknown error occurred')
            });
            dispatch({
                type: 'SET_TOPICS',
                payload: []
            });
        } finally{
            dispatch({
                type: 'SET_LOADING',
                payload: false
            });
        }
    }, [
        baseAPIURL
    ]);
    const fetchLessons = useCallback(async (topicId)=>{
        dispatch({
            type: 'SET_LOADING',
            payload: true
        });
        dispatch({
            type: 'SET_ERROR',
            payload: null
        });
        const query = qs.stringify({
            where: {
                topic: {
                    equals: topicId
                }
            }
        });
        try {
            const response = await fetch(`${baseAPIURL}/lessons?${query}`);
            if (!response.ok) {
                throw new Error('Failed to fetch lessons');
            }
            const data = await response.json();
            dispatch({
                type: 'SET_LESSONS',
                payload: data.docs
            });
        } catch (e) {
            dispatch({
                type: 'SET_ERROR',
                payload: e instanceof Error ? e : new Error('An unknown error occurred')
            });
            dispatch({
                type: 'SET_LESSONS',
                payload: []
            });
        } finally{
            dispatch({
                type: 'SET_LOADING',
                payload: false
            });
        }
    }, [
        baseAPIURL
    ]);
    const fetchQuizzes = useCallback(async (lessonId)=>{
        dispatch({
            type: 'SET_LOADING',
            payload: true
        });
        dispatch({
            type: 'SET_ERROR',
            payload: null
        });
        const query = qs.stringify({
            where: {
                lesson: {
                    equals: lessonId
                }
            }
        });
        try {
            const response = await fetch(`${baseAPIURL}/quizzes?${query}`);
            if (!response.ok) {
                throw new Error('Failed to fetch quizzes');
            }
            const data = await response.json();
            dispatch({
                type: 'SET_QUIZZES',
                payload: data.docs
            });
        } catch (e) {
            dispatch({
                type: 'SET_ERROR',
                payload: e instanceof Error ? e : new Error('An unknown error occurred')
            });
            dispatch({
                type: 'SET_QUIZZES',
                payload: []
            });
        } finally{
            dispatch({
                type: 'SET_LOADING',
                payload: false
            });
        }
    }, [
        baseAPIURL
    ]);
    const value = {
        addUserToGroup,
        certificates: state.certificates,
        completeCourse,
        completedCourses: state.completedCourses,
        completeLesson,
        courses: state.courses,
        enroll,
        enrolledCourses: state.enrolledCourses,
        error: state.error,
        fetchCourses,
        fetchLessons,
        fetchProgress,
        fetchQuizzes,
        fetchTopics,
        fetchUsers,
        getProgress,
        isLoading: state.isLoading,
        lessons: state.lessons,
        progress: state.progress,
        quizStarted: state.quizStarted,
        quizzes: state.quizzes,
        setQuizCompleted,
        setQuizExited,
        startQuiz,
        submitQuiz,
        topics: state.topics,
        users: state.users
    };
    return /*#__PURE__*/ _jsx(LMSContext, {
        value: value,
        children: children
    });
};
export const useLMS = ()=>{
    const context = use(LMSContext);
    if (context === undefined) {
        throw new Error('useLMS must be used within a LMSProvider');
    }
    return context;
};

//# sourceMappingURL=index.js.map