import { CollectionConfig, Field } from 'payload';
import { FieldsOverride } from '../types.js';
import { slugField } from '../fields/slug.js';

type Props = {
    overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}


export const categoriesCollection: (props?: Props) => CollectionConfig<'categories'> = (props) => {
  const { overrides } = props || {}
  const fieldsOverride = overrides?.fields

  const defaultFields: Field[] = [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'The title of the category',
      },
    },
    ...slugField(),
    
  ]

  const fields =
  fieldsOverride && typeof fieldsOverride === 'function'
    ? fieldsOverride({ defaultFields })
    : defaultFields

    const baseConfig: CollectionConfig = {
      slug: 'categories',
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
