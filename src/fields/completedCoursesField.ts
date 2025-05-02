import type { RelationshipField } from 'payload'

/**
 * Props for the roles field configuration
 */
type Props = {
  overrides?: Partial<RelationshipField>
}

/**
 * Creates a relationship field for completed courses
 * @param props - Configuration overrides for the field
 * @returns A configured relationship field for completed courses
 */
export const completedCoursesField: (props: Props) => RelationshipField = ({ overrides }) => {
  // @ts-expect-error - issue with payload types
  const field: RelationshipField = {
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
