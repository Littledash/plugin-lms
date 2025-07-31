/**
 * Creates a relationship field for enrolled courses
 * @param props - Configuration overrides for the field
 * @returns A configured relationship field for enrolled courses
 */ export const enrolledCoursesField = ({ overrides }) => {
  // @ts-expect-error - issue with payload types
  const field = {
    name: 'enrolledCourses',
    type: 'relationship',
    relationTo: 'courses',
    hasMany: true,
    ...overrides,
    admin: {
      allowCreate: false,
      ...overrides?.admin,
    },
  }
  return field
}

//# sourceMappingURL=enrolledCoursesField.js.map
