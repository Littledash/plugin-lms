/**
 * Creates a relationship field for completed courses
 * @param props - Configuration overrides for the field
 * @returns A configured relationship field for completed courses
 */ export const completedCoursesField = ({ coursesCollectionSlug, overrides })=>{
    const field = {
        name: 'completedCourses',
        type: 'join',
        collection: coursesCollectionSlug || 'courses',
        on: 'courseCompletedStudents',
        ...overrides,
        admin: {
            allowCreate: false,
            description: 'Courses this student has completed. Filled in by the LMS when they finish a course.',
            ...overrides?.admin
        }
    };
    return field;
};

//# sourceMappingURL=completedCoursesField.js.map