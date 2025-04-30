import { CollectionConfig, Field } from 'payload';
import { FieldsOverride } from '../types.js';
import { slugField } from '../fields/slug.js';

type Props = {
    overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}


export const tagsCollection: (props?: Props) => CollectionConfig = (props) => {
  const { overrides } = props || {}
  const fieldsOverride = overrides?.fields

  const defaultFields: Field[] = [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'The title of the tag',
      },
    },
    ...slugField(),
    
  ]

  const fields =
  fieldsOverride && typeof fieldsOverride === 'function'
    ? fieldsOverride({ defaultFields })
    : defaultFields

    const baseConfig: CollectionConfig = {
      slug: 'tags',
      access: {
        // TODO: Add access control
        read: () => true,
      },
      timestamps: true,
      ...overrides,
      admin: {
        useAsTitle: 'title',
        ...overrides?.admin,
      },
      fields,
    }
  
    return { ...baseConfig }

}
