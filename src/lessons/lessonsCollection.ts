import { CollectionConfig, Field } from 'payload';
import { FieldsOverride } from '../types.js';
import { embeddedVideo } from '../fields/embeddedVideo.js';
import { isAdminOrAuthor } from '../access/isAdminOrAuthor.js';

import { isAdminOrAuthorOrEnrolledInCourseFieldLevel } from '../access/isAdminOrAuthorOrEnrolledInCourse.js';
/**
 * Props interface for configuring the lessons collection
 * @property coursesCollectionSlug - Slug for the courses collection (default: 'courses')
 * @property mediaCollectionSlug - Slug for the media collection (default: 'media')
 * @property quizzesCollectionSlug - Slug for the quizzes collection (default: 'quizzes')
 * @property overrides - Optional configuration overrides for fields and collection settings
 */
type Props = {
    coursesCollectionSlug?: string
    mediaCollectionSlug?: string
    quizzesCollectionSlug?: string
    overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}

/**
 * Creates a lessons collection configuration for Payload CMS
 * This collection manages individual lessons within courses, including content, media, and assessments
 * 
 * @param props - Configuration properties for the lessons collection
 * @returns CollectionConfig object for lessons
 */
export const lessonsCollection: (props?: Props) => CollectionConfig<'lessons'> = (props) => {
  const { overrides, mediaCollectionSlug = 'media', coursesCollectionSlug = 'courses', quizzesCollectionSlug = 'quizzes' } = props || {}
  const fieldsOverride = overrides?.fields

  /**
   * Default fields for the lessons collection
   * Includes lesson content, media, progression control, and assessment relationships
   */
  const defaultFields: Field[] = [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'The title of the lesson',
      },
    },
    {
      name: 'excerpt',
      type: 'text',
      admin: {
        description: 'The excerpt of the lesson',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description: 'The content of the lesson',
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
        description: 'The featured image of the lesson',
      },
    },
    {
      name: 'course',
      type: 'relationship',
      relationTo: coursesCollectionSlug,
      admin: {
        description: 'The course that the lesson belongs to',
      },
    },
    embeddedVideo({
      mediaCollectionSlug,
      overrides: {
        access: {
          read: isAdminOrAuthorOrEnrolledInCourseFieldLevel,
        },
      },
    }),
    {
      name: 'lessonMaterials',
      type: 'richText',
      label: 'Lesson Materials',
      admin: {
        description: 'The materials of the lesson',
      },
      access: {
        read: isAdminOrAuthorOrEnrolledInCourseFieldLevel,
      }, 
    },
    {
      name: 'progressionControl',
      type: 'select',
      label: 'Progression Behavior',
      options: [
        { label: 'Required to complete', value: 'required' },
        { label: 'Optional', value: 'optional' },
      ],
      defaultValue: 'required',
      admin: {
        description: 'The progression behavior of the lesson',
      },
    },
    {
      name: 'lessonOrder',
      type: 'number',
      label: 'Lesson Order',
      admin: {
        description: 'The order of the lesson in the course', // TODO: Not sure if this is needed
      },
    },
    {
      name: 'quizzes',
      type: 'relationship',
      relationTo: quizzesCollectionSlug,
      hasMany: true,
      admin: {
        description: 'The quizzes that are part of the lesson',
      },
    },
  ]

  // Apply field overrides if provided
  const fields =
  fieldsOverride && typeof fieldsOverride === 'function'
    ? fieldsOverride({ defaultFields })
    : defaultFields

  /**
   * Base configuration for the lessons collection
   * Includes slug, access control, timestamps, and admin settings
   */
  const baseConfig: CollectionConfig = {
    slug: 'lessons',
    access: {
      create: isAdminOrAuthor,
      // read: isAdminOrAuthorOrEnrolledInCourse, // TODO not sure if everyone should be able to read lessons
      update: isAdminOrAuthor,
      delete: isAdminOrAuthor,
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
