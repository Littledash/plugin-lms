export const initialState = {
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
    error: null
};
export const lmsReducer = (state, action)=>{
    switch(action.type){
        case 'SET_LOADING':
            return {
                ...state,
                isLoading: action.payload
            };
        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload
            };
        case 'SET_USERS':
            return {
                ...state,
                users: action.payload
            };
        case 'SET_COURSES':
            return {
                ...state,
                courses: action.payload
            };
        case 'SET_TOPICS':
            return {
                ...state,
                topics: action.payload
            };
        case 'SET_LESSONS':
            return {
                ...state,
                lessons: action.payload
            };
        case 'SET_QUIZZES':
            return {
                ...state,
                quizzes: action.payload
            };
        case 'SET_CERTIFICATES':
            return {
                ...state,
                certificates: action.payload
            };
        case 'ENROLL_IN_COURSE':
            return {
                ...state,
                enrolledCourses: [
                    ...state.enrolledCourses,
                    action.payload
                ]
            };
        case 'COMPLETE_COURSE':
            return {
                ...state,
                enrolledCourses: state.enrolledCourses.filter((courseId)=>courseId !== action.payload),
                completedCourses: [
                    ...state.completedCourses,
                    action.payload
                ]
            };
        case 'UPDATE_PROGRESS':
            return {
                ...state,
                progress: action.payload
            };
        case 'SET_ENROLLED_COURSES':
            return {
                ...state,
                enrolledCourses: action.payload
            };
        case 'SET_COMPLETED_COURSES':
            return {
                ...state,
                completedCourses: action.payload
            };
        case 'LOAD_FROM_STORAGE':
            return {
                ...state,
                progress: action.payload.progress,
                enrolledCourses: action.payload.enrolledCourses,
                completedCourses: action.payload.completedCourses
            };
        case 'RESET_STATE':
            return initialState;
        default:
            return state;
    }
};

//# sourceMappingURL=reducer.js.map