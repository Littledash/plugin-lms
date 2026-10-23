import type { ArrayField } from 'payload'

import { isAdminFieldLevel } from '../access/isAdmin.js'

/**
 * Props for the certificates field configuration
 */
type Props = {
  certificatesCollectionSlug?: string
  coursesCollectionSlug?: string
  mediaCollectionSlug?: string
  overrides?: Partial<ArrayField>
}

/**
 * Creates an array field for certificates with certificate and completed date
 * @param props - Configuration overrides for the field
 * @returns A configured array field for certificates
 */
export const certificatesField: (props: Props) => ArrayField = ({
  certificatesCollectionSlug = 'certificates',
  coursesCollectionSlug = 'courses',
  mediaCollectionSlug = 'media',
  overrides,
}) => {
  const field: ArrayField = {
    name: 'certificates',
    type: 'array',
    // Written by the LMS services; users must not be able to edit their own progress
    access: {
      create: isAdminFieldLevel,
      update: isAdminFieldLevel,
    },
    fields: [
      {
        // Set when the PDF is generated; its file name is random so it cannot be guessed
        name: 'file',
        type: 'upload',
        admin: {
          readOnly: true,
        },
        relationTo: mediaCollectionSlug,
      },
      {
        name: 'certificate',
        type: 'relationship',
        admin: {
          allowCreate: false,
          allowEdit: false,
        },
        relationTo: certificatesCollectionSlug || 'certificates',
        required: true,
      },
      {
        name: 'completedDate',
        type: 'date',
        admin: {
          description: 'The date when the certificate was completed',
        },
        required: true,
      },
      {
        name: 'course',
        type: 'relationship',
        admin: {
          allowCreate: false,
          allowEdit: false,
          description: 'The course that the certificate is for',
        },
        hasMany: false,
        relationTo: coursesCollectionSlug || 'courses',
        required: true,
      },
    ],
    ...overrides,
    admin: {
      ...overrides?.admin,
    },
  }

  return field
}
