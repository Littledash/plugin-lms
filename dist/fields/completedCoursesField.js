/**
 * Creates a relationship field for completed courses
 * @param props - Configuration overrides for the field
 * @returns A configured relationship field for completed courses
 */ export const completedCoursesField = ({ overrides }) => {
  // @ts-expect-error - issue with payload types
  const field = {
    name: 'completedCourses',
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

//# sourceMappingURL=completedCoursesField.js.map
