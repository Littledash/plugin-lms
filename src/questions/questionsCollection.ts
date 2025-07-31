import { CollectionConfig, Field } from 'payload'
import { FieldsOverride } from '../types.js'

/**
 * Props interface for configuring the questions collection
 * @property overrides - Optional configuration overrides for fields and collection settings
 */
type Props = {
  studentsCollectionSlug?: string
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}

/**
 * Creates a questions collection configuration for Payload CMS
 * This collection manages questions for quizzes and assessments
 *
 * @param props - Configuration properties for the questions collection
 * @returns CollectionConfig object for questions
 */
export const questionsCollection: (props?: Props) => CollectionConfig<'questions'> = (props) => {
  const { overrides, studentsCollectionSlug = 'users' } = props || {}
  const fieldsOverride = overrides?.fields

  /**
   * Default fields for the questions collection
   * Includes question details, access control, and content organization
   */
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
        {
          name: 'order',
          type: 'number',
          admin: { condition: (_, siblingData) => siblingData.questionType === 'sorting' },
        },
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
      fields: [{ name: 'answer', type: 'text', required: true }],
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
    {
      name: 'authors',
      type: 'relationship',
      relationTo: studentsCollectionSlug,
      hasMany: true,
      admin: {
        allowCreate: false,
        description: 'The authors of the question',
      },
    },
  ]

  // Apply field overrides if provided
  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields })
      : defaultFields

  /**
   * Base configuration for the questions collection
   * Includes slug, access control, timestamps, and admin settings
   */
  const baseConfig: CollectionConfig = {
    slug: 'questions',
    timestamps: true,
    ...overrides,
    admin: {
      useAsTitle: 'title',
      group: 'LMS',
      ...overrides?.admin,
    },
    fields,
  }

  return { ...baseConfig }
}
