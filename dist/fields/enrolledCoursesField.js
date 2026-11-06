/**
 * Creates a relationship field for enrolled courses
 * @param props - Configuration overrides for the field
 * @returns A configured relationship field for enrolled courses
 */ export const enrolledCoursesField = ({ coursesCollectionSlug, overrides })=>{
    const field = {
        name: 'enrolledCourses',
        type: 'join',
        collection: coursesCollectionSlug || 'courses',
        on: 'enrolledStudents',
        ...overrides,
        admin: {
            allowCreate: false,
            description: 'Courses this student is enrolled in. Change enrollments on the course, or through a purchase.',
            ...overrides?.admin
        }
    };
    return field;
};

//# sourceMappingURL=enrolledCoursesField.js.map