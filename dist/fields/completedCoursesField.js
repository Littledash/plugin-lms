/**
 * Creates a relationship field for completed courses
 * @param props - Configuration overrides for the field
 * @returns A configured relationship field for completed courses
 */ export const completedCoursesField = ({ overrides, coursesCollectionSlug, studentsCollectionSlug })=>{
    const field = {
        name: 'completedCourses',
        type: 'join',
        collection: coursesCollectionSlug || 'courses',
        on: studentsCollectionSlug || 'students',
        ...overrides,
        admin: {
            allowCreate: false,
            ...overrides?.admin
        }
    };
    return field;
};

//# sourceMappingURL=completedCoursesField.js.map