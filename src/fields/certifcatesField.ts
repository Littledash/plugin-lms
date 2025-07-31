import type { JoinField } from 'payload'

/**
 * Props for the roles field configuration
 */
type Props = {
  certificatesCollectionSlug?: string
  studentsCollectionSlug?: string
  overrides?: Partial<JoinField>
}

/**
 * Creates a relationship field for certificates
 * @param props - Configuration overrides for the field
 * @returns A configured relationship field for certificates
 */
export const certificatesField: (props: Props) => JoinField = ({
  overrides,
  certificatesCollectionSlug,
  studentsCollectionSlug,
}) => {
  const field: JoinField = {
    name: 'certificates',
    type: 'join',
    collection: certificatesCollectionSlug || 'certificates',
    on: studentsCollectionSlug || 'students',
    ...overrides,
    admin: {
      allowCreate: false,
      ...overrides?.admin,
    },
  }

  return field
}
