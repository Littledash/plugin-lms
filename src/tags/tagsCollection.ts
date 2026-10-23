import type { CollectionConfig, Field } from 'payload'

import type { FieldsOverride } from '../types.js'

import { defaultAccess, withDefaultAccess } from '../access/defaultAccess.js'
import { slugField } from '../fields/slug.js'

type Props = {
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}

export const tagsCollection: (props?: Props) => CollectionConfig<'tags'> = (props) => {
  const { overrides } = props || {}
  const fieldsOverride = overrides?.fields

  const defaultFields: Field[] = [
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'The title of the tag',
      },
      required: true,
    },
    ...slugField(),
  ]

  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields })
      : defaultFields

  const baseConfig: CollectionConfig = {
    slug: 'tags',
    timestamps: true,
    ...overrides,
    access: withDefaultAccess(defaultAccess.tags, overrides?.access),
    admin: {
      group: 'Taxonomy',
      useAsTitle: 'title',
      ...overrides?.admin,
    },
    fields,
  }

  return { ...baseConfig }
}
