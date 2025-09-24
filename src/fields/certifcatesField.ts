import type { ArrayField } from 'payload'

/**
 * Props for the certificates field configuration
 */
type Props = {
  certificatesCollectionSlug?: string
  overrides?: Partial<ArrayField>
}

/**
 * Creates an array field for certificates with certificate and completed date
 * @param props - Configuration overrides for the field
 * @returns A configured array field for certificates
 */
export const certificatesField: (props: Props) => ArrayField = ({
  overrides,
  certificatesCollectionSlug,
}) => {
  const field: ArrayField = {
    name: 'certificates',
    type: 'array',
    fields: [
      {
        name: 'certificate',
        type: 'relationship',
        relationTo: certificatesCollectionSlug || 'certificates',
        required: true,
        admin: {
          allowCreate: false,
        },
      },
      {
        name: 'completedDate',
        type: 'date',
        required: true,
        admin: {
          description: 'The date when the certificate was completed',
        },
      },
    ],
    ...overrides,
    admin: {
      ...overrides?.admin,
    },
  }

  return field
}
