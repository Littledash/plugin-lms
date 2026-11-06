import type { CollectionConfig, Field, FieldHook } from 'payload'

import type { FieldsOverride } from '../types.js'

import { checkRole } from '../access/checkRole.js'
import { defaultAccess, withDefaultAccess } from '../access/defaultAccess.js'

type Props = {
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  studentsCollectionSlug?: string
}

/**
 * Accepted file types, checked against the file's contents rather than its name.
 *
 * Images are listed one by one instead of `image/*` so SVG is excluded: anyone logged in can upload
 * here, and an SVG can carry script that runs when staff open the file. Word is `.docx` only:
 * older `.doc` files are detected as a generic Office container that also covers spreadsheets,
 * presentations and macro-carrying files.
 */
export const DEFAULT_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  // Photos from iPhones
  'image/heic',
  'image/heif',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

/**
 * Only admins choose the owner. Anyone else always owns what they upload, so a document cannot be
 * filed under another user. Server code with no user on the request (the LMS services) keeps the
 * owner it passes.
 */
const assignOwner: FieldHook = ({ req, value }) => {
  if (!req.user || checkRole(['admin'], req.user)) {return value}
  return req.user.id
}

/**
 * Private uploads, such as generated certificates and files sent through site forms. Unlike a
 * public media collection, each document is readable only by its owner and admins and authors,
 * and downloads go through the same check.
 */
export const documentsCollection: (props?: Props) => CollectionConfig = (props) => {
  const { overrides, studentsCollectionSlug = 'users' } = props || {}
  const fieldsOverride = overrides?.fields

  const defaultFields: Field[] = [
    {
      name: 'title',
      type: 'text',
      admin: {
        description:
          'A name staff will recognise, such as "Certificate - Course - Student name".',
      },
    },
    {
      name: 'owner',
      type: 'relationship',
      admin: {
        description:
          'The person this document belongs to. Only they, admins and authors can open it. Set when it is uploaded: a user who uploads a file always owns it, and only admins can change the owner.',
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [assignOwner],
      },
      index: true,
      relationTo: studentsCollectionSlug,
    },
  ]

  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields })
      : defaultFields

  const baseConfig: CollectionConfig = {
    slug: 'documents',
    timestamps: true,
    upload: {
      mimeTypes: DEFAULT_DOCUMENT_MIME_TYPES,
    },
    ...overrides,
    access: withDefaultAccess(defaultAccess.documents, overrides?.access),
    admin: {
      defaultColumns: ['filename', 'title', 'owner', 'createdAt'],
      description:
        'Private files that belong to one person, such as certificates and files sent through site forms. Only the owner and staff can open them. Lesson handouts go in Course Files, and images for public pages go in Media. Accepts PDF, JPEG, PNG, WebP, GIF, HEIC and Word (.docx).',
      useAsTitle: 'filename',
      ...overrides?.admin,
    },
    fields,
  }

  return { ...baseConfig }
}
