import { CollectionConfig, Field } from 'payload'
import { FieldsOverride } from '../types.js'
import { isAdminOrAuthorOrStudent } from '../access/isAdminOrAuthorOrStudent.js'
import { isAdminOrAuthor } from '../access/isAdminOrAuthor.js'
import { isAdminOrAuthorOrEnrolledInCourseFieldLevel } from '../access/isAdminOrAuthorOrEnrolledInCourse.js'
/**
 * Props interface for configuring the quizzes collection
 * @property mediaCollectionSlug - Slug for the media collection (default: 'media')
 * @property overrides - Optional configuration overrides for fields and collection settings
 */
type Props = {
  mediaCollectionSlug?: string
  studentsCollectionSlug?: string
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}

/**
 * Creates a quizzes collection configuration for Payload CMS
 * This collection manages quizzes and assessments
 *
 * @param props - Configuration properties for the quizzes collection
 * @returns CollectionConfig object for quizzes
 */
export const quizzesCollection: (props?: Props) => CollectionConfig<'quizzes'> = (props) => {
  const { overrides, mediaCollectionSlug = 'media', studentsCollectionSlug = 'users' } = props || {}
  const fieldsOverride = overrides?.fields

  /**
   * Default fields for the quizzes collection
   * Includes quiz details, access control, and content organization
   */
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
      name: 'excerpt',
      type: 'text',
      admin: {
        description: 'The excerpt of the quiz',
      },
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      admin: {
        description: 'The description of the quiz',
      },
      access: {
        read: isAdminOrAuthorOrEnrolledInCourseFieldLevel,
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
      type: 'relationship',
      relationTo: 'questions',
      hasMany: true,
      required: true,
      admin: {
        description: 'The questions in this quiz',
      },
      access: {
        read: isAdminOrAuthorOrEnrolledInCourseFieldLevel,
      },
    },
    {
      name: 'authors',
      type: 'relationship',
      relationTo: studentsCollectionSlug,
      hasMany: true,
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
    access: {
      read: isAdminOrAuthorOrStudent, // TODO not sure if everyone should be able to read quizzes
      create: isAdminOrAuthor,
      update: isAdminOrAuthor,
      delete: isAdminOrAuthor,
    },
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
