import type { JoinField, RelationshipField } from 'payload'

/**
 * Props for the roles field configuration
 */
type Props = {
  coursesCollectionSlug?: string
  overrides?: Partial<JoinField>
  studentsCollectionSlug?: string
}

/**
 * Creates a relationship field for completed courses
 * @param props - Configuration overrides for the field
 * @returns A configured relationship field for completed courses
 */
export const completedCoursesField: (props: Props) => JoinField = ({
  coursesCollectionSlug,
  overrides,
  studentsCollectionSlug,
}) => {
  const field: JoinField = {
    name: 'completedCourses',
    type: 'join',
    collection: coursesCollectionSlug || 'courses',
    on: 'courseCompletedStudents',
    ...overrides,
    admin: {
      allowCreate: false,
      ...overrides?.admin,
    },
  }

  return field
}
