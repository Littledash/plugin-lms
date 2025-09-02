/**
 * Creates a relationship field for enrolled courses
 * @param props - Configuration overrides for the field
 * @returns A configured relationship field for enrolled courses
 */ export const enrolledCoursesField = ({ overrides, coursesCollectionSlug, studentsCollectionSlug })=>{
    const field = {
        name: 'enrolledCourses',
        type: 'join',
        collection: coursesCollectionSlug || 'courses',
        on: 'enrolledStudents',
        ...overrides,
        admin: {
            allowCreate: false,
            ...overrides?.admin
        }
    };
    return field;
};

//# sourceMappingURL=enrolledCoursesField.js.map