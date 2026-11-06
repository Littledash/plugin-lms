import type { ArrayField } from 'payload'

import { isAdminFieldLevel } from '../access/isAdmin.js'

/**
 * Props for the certificates field configuration
 */
type Props = {
  certificatesCollectionSlug?: string
  coursesCollectionSlug?: string
  documentsCollectionSlug?: string
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
  documentsCollectionSlug = 'documents',
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
        // The certificate PDF, stored privately: only the student and staff can open it
        name: 'document',
        type: 'upload',
        admin: {
          description: 'The certificate PDF. Private: only the student and staff can open it.',
          readOnly: true,
        },
        relationTo: documentsCollectionSlug,
      },
      {
        // Before private documents, the PDF was kept in the public media collection. The plugin
        // moves it to `document` (and deletes the public copy) the next time it is requested.
        name: 'file',
        type: 'upload',
        admin: {
          description: 'Legacy public copy of the PDF. Replaced by Document.',
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
          description: 'The certificate design that was awarded.',
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
      description:
        'Certificates the student has earned, added by the LMS when they complete a course. Only admins can change them.',
      ...overrides?.admin,
    },
  }

  return field
}
