import { CollectionConfig, Field } from 'payload';
import { FieldsOverride } from '../types.js';

type Props = {
    mediaCollectionSlug?: string
    overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}

export const quizzesCollection: (props?: Props) => CollectionConfig<'quizzes'> = (props) => {
  const { overrides, mediaCollectionSlug = 'media'} = props || {}
  const fieldsOverride = overrides?.fields

  const defaultFields: Field[] = [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'The title of the quiz',
      },
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      admin: {
        description: 'The description of the quiz',
      },
    },
    {
      name: 'excerpt',
      type: 'text',
      admin: {
        description: 'The excerpt of the quiz',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: mediaCollectionSlug,
      admin: {
        position: 'sidebar',
        description: 'The featured image of the quiz',
      },
    },
    // {
    //   name: 'questions',
    //   type: 'relationship',
    //   relationTo: 'questions',
    //   hasMany: true,
    //   required: true,
    //   admin: {
    //     description: 'The questions in this quiz',
    //   },
    // },
  ]

  const fields =
  fieldsOverride && typeof fieldsOverride === 'function'
    ? fieldsOverride({ defaultFields })
    : defaultFields

    const baseConfig: CollectionConfig = {
      slug: 'quizzes',
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
