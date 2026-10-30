import type { CollectionConfig, Field, FieldHook } from 'payload'

import type { FieldsOverride } from '../types.js'

import { checkRole } from '../access/checkRole.js'
import { defaultAccess, withDefaultAccess } from '../access/defaultAccess.js'

type Props = {
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  studentsCollectionSlug?: string
}

/**
 * Accepted file types, checked against the file's contents rather than its name. Word is `.docx`
 * only: older `.doc` files are detected as a generic Office container that also covers
 * spreadsheets, presentations and macro-carrying files, so they are left out.
 */
export const DEFAULT_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/*',
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
    },
    {
      name: 'owner',
      type: 'relationship',
      admin: {
        description: 'The user this document belongs to. Only they and admins can read it.',
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
      useAsTitle: 'filename',
      ...overrides?.admin,
    },
    fields,
  }

  return { ...baseConfig }
}
