import { CollectionConfig, Field } from 'payload';
import { FieldsOverride } from '../types.js';

type Props = {
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}

export const questionsCollection: (props?: Props) => CollectionConfig<'questions'> = (props) => {
  const { overrides } = props || {}
  const fieldsOverride = overrides?.fields

  const defaultFields: Field[] = [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'The title of the question',
      },
    },
    {
      name: 'points',
      type: 'number',
      required: true,
      min: 0,
      defaultValue: 1,
      admin: {
        step: 0.1,
        description: 'Points awarded for correct answer',
      },
    },
    {
      name: 'questionType',
      type: 'select',
      required: true,
      options: [
        { label: 'Multiple Choice', value: 'multipleChoice' },
        { label: 'True/False', value: 'trueFalse' },
        { label: 'Sorting', value: 'sorting' },
        { label: 'Fill in the Blank', value: 'fillInBlank' },
        { label: 'Assessment', value: 'assessment' },
        { label: 'Essay/Open Answer', value: 'essay' },
        { label: 'Free Choice', value: 'freeChoice' },
        { label: 'Single Choice', value: 'singleChoice' },
      ],
    },
    {
      name: 'question',
      type: 'text',
      required: true,
    },
    {
      name: 'choices',
      type: 'array',
      admin: {
        condition: (_, siblingData) => 
          ['multipleChoice', 'singleChoice', 'sorting'].includes(siblingData.questionType),
      },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'isCorrect', type: 'checkbox' },
        { name: 'order', type: 'number', admin: { condition: (_, siblingData) => siblingData.questionType === 'sorting' } },
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
    {
      name: 'correctAnswers',
      type: 'array',
      admin: {
        condition: (_, siblingData) => siblingData.questionType === 'fillInBlank',
      },
      fields: [
        { name: 'answer', type: 'text', required: true },
      ],
    },
    {
      name: 'assessmentCriteria',
      type: 'array',
      admin: {
        condition: (_, siblingData) => siblingData.questionType === 'assessment',
      },
      fields: [
        { name: 'criterion', type: 'text', required: true },
        { name: 'points', type: 'number', required: true },
      ],
    },
    {
      name: 'maxLength',
      type: 'number',
      admin: {
        condition: (_, siblingData) => siblingData.questionType === 'essay',
      },
      defaultValue: 500,
    },
  ]

  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields })
      : defaultFields

  const baseConfig: CollectionConfig = {
    slug: 'questions',
    access: {
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