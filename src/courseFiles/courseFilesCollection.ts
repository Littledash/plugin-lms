import type { CollectionConfig, Field } from 'payload'

import type { FieldsOverride } from '../types.js'

import { defaultAccess, withDefaultAccess } from '../access/defaultAccess.js'

type Props = {
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}

/**
 * Files that come with paid lessons, such as workbooks and handouts. A file is readable, and
 * downloadable, only by students who can currently open a lesson offering it, and by admins and
 * authors. Public images belong in the media collection instead.
 */
export const courseFilesCollection: (props?: Props) => CollectionConfig = (props) => {
  const { overrides } = props || {}
  const fieldsOverride = overrides?.fields

  const defaultFields: Field[] = [
    {
      name: 'title',
      type: 'text',
      admin: {
        description:
          'A name for the download that students will understand, such as "Week 1 workbook".',
      },
    },
  ]

  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields })
      : defaultFields

  const baseConfig: CollectionConfig = {
    slug: 'course-files',
    timestamps: true,
    // Only staff upload here; Payload still refuses executables and other restricted types
    upload: true,
    ...overrides,
    access: withDefaultAccess(defaultAccess.courseFiles, overrides?.access),
    admin: {
      defaultColumns: ['filename', 'title', 'updatedAt'],
      description:
        'Downloads for lessons, such as workbooks and handouts. Students can open a file only while they can open a lesson that offers it. Images for public pages go in Media, and files that belong to one person go in Documents.',
      useAsTitle: 'filename',
      ...overrides?.admin,
    },
    fields,
  }

  return { ...baseConfig }
}
