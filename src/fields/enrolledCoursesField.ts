import type { JoinField } from 'payload'

/**
 * Props for the roles field configuration
 */
type Props = {
  coursesCollectionSlug?: string
  overrides?: Partial<JoinField>
  studentsCollectionSlug?: string
}

/**
 * Creates a relationship field for enrolled courses
 * @param props - Configuration overrides for the field
 * @returns A configured relationship field for enrolled courses
 */
export const enrolledCoursesField: (props: Props) => JoinField = ({
  coursesCollectionSlug,
  overrides,
  studentsCollectionSlug,
}) => {
  const field: JoinField = {
    name: 'enrolledCourses',
    type: 'join',
    collection: coursesCollectionSlug || 'courses',
    on: 'enrolledStudents',
    ...overrides,
    admin: {
      allowCreate: false,
      ...overrides?.admin,
    },
  }

  return field
}
