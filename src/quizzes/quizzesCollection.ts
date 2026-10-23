import type { CollectionConfig, Field } from 'payload'

import type { FieldsOverride } from '../types.js'

import { defaultAccess, withDefaultAccess } from '../access/defaultAccess.js'
import { isAdminOrAuthorOrEnrolledInQuizCourseFieldLevel } from '../access/isAdminOrAuthorOrEnrolledInCourse.js'
/**
 * Props interface for configuring the quizzes collection
 * @property mediaCollectionSlug - Slug for the media collection (default: 'media')
 * @property overrides - Optional configuration overrides for fields and collection settings
 */
type Props = {
  mediaCollectionSlug?: string
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  studentsCollectionSlug?: string
}

/**
 * Creates a quizzes collection configuration for Payload CMS
 * This collection manages quizzes and assessments
 *
 * @param props - Configuration properties for the quizzes collection
 * @returns CollectionConfig object for quizzes
 */
export const quizzesCollection: (props?: Props) => CollectionConfig<'quizzes'> = (props) => {
  const { mediaCollectionSlug = 'media', overrides, studentsCollectionSlug = 'users' } = props || {}
  const fieldsOverride = overrides?.fields

  /**
   * Default fields for the quizzes collection
   * Includes quiz details, access control, and content organization
   */
  const defaultFields: Field[] = [
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'The title of the quiz',
      },
      required: true,
    },
    {
      name: 'excerpt',
      type: 'text',
      admin: {
        description: 'The excerpt of the quiz',
      },
    },
    {
      name: 'description',
      type: 'richText',
      access: {
        read: isAdminOrAuthorOrEnrolledInQuizCourseFieldLevel,
      },
      admin: {
        description: 'The description of the quiz',
      },
    },
    {
      name: 'questions',
      type: 'relationship',
      access: {
        read: isAdminOrAuthorOrEnrolledInQuizCourseFieldLevel,
      },
      admin: {
        allowCreate: false,
        description: 'The questions in this quiz',
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: 'questions',
    },
    {
      name: 'minimumScore',
      type: 'number',
      admin: {
          description: 'Minimum score required (0-100) to pass the quiz',
      },
      defaultValue: 100,
      max: 100,
      min: 0
  },
    {
      name: 'attemptLimit',
      type: 'number',
      admin: {
        description: 'Maximum attempts per student. Leave empty for unlimited.',
      },
      min: 0,
    },
    {
      name: 'authors',
      type: 'relationship',
      admin: {
        allowCreate: false,
        description: 'The authors of the quiz',
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: studentsCollectionSlug,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      admin: {
        description: 'The featured image of the quiz',
        position: 'sidebar',
      },
      relationTo: mediaCollectionSlug,
    },
  ]

  // Apply field overrides if provided
  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields })
      : defaultFields

  /**
   * Base configuration for the quizzes collection
   * Includes slug, access control, timestamps, and admin settings
   */
  const baseConfig: CollectionConfig = {
    slug: 'quizzes',
    timestamps: true,
    ...overrides,
    access: withDefaultAccess(defaultAccess.quizzes, overrides?.access),
    admin: {
      useAsTitle: 'title',
      // group: 'LMS',
      ...overrides?.admin,
    },
    fields,
  }

  return { ...baseConfig }
}
