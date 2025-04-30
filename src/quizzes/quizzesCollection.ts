import { CollectionConfig, Field } from 'payload';
import { FieldsOverride } from '../types.js';

type Props = {
    mediaCollectionSlug?: string
    overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}


export const quizzesCollection: (props?: Props) => CollectionConfig = (props) => {
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
    {
      name: 'questions',
      type: 'array',
      fields: [
        {
          name: 'question',
          type: 'text',
        },
        {
          name: 'questionType',
          type: 'select',
          options: [
            { label: 'Multiple Choice', value: 'multipleChoice' },
            { label: 'True/False', value: 'trueFalse' },
          ],
        },     {
          name: 'choices',
          type: 'array',
          admin: {
            condition: (_, siblingData) => siblingData.questionType === 'multipleChoice',
          },
          fields: [
            { name: 'label', type: 'text' },
            { name: 'isCorrect', type: 'checkbox' },
          ],
        },
        {
          name: 'correctAnswer',
          type: 'select',
          admin: {
            condition: (_, siblingData) => siblingData.questionType === 'trueFalse',
          },
          options: [
            { label: 'True', value: 'true' },
            { label: 'False', value: 'false' },
          ],
        },
        
      ],
    },

  
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
