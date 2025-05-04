import { CollectionConfig, Field } from 'payload';
import { FieldsOverride } from '../types.js';
import { embeddedVideo } from '../fields/embeddedVideo.js';
import { isAdminOrAuthor } from '../access/isAdminOrAuthor.js';
import { isAdminOrAuthorOrEnrolledInCourseFieldLevel } from '../access/isAdminOrAuthorOrEnrolledInCourse.js';
import { isAdminOrPublished } from '../access/isAdminOrPublished.js';
import { videoProgression } from '../fields/videoProgression.js';

/**
 * Props interface for configuring the topics collection
 * @property coursesCollectionSlug - Slug for the courses collection (default: 'courses')
 * @property mediaCollectionSlug - Slug for the media collection (default: 'media')
 * @property quizzesCollectionSlug - Slug for the quizzes collection (default: 'quizzes')
 * @property lessonsCollectionSlug - Slug for the lessons collection (default: 'lessons')
 * @property overrides - Optional configuration overrides for fields and collection settings
 */
type Props = {
    coursesCollectionSlug?: string
    mediaCollectionSlug?: string
    quizzesCollectionSlug?: string
    lessonsCollectionSlug?: string
    overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}

/**
 * Creates a topics collection configuration for Payload CMS
 * This collection manages individual topics within lessons, including content, media, and assessments
 * 
 * @param props - Configuration properties for the topics collection
 * @returns CollectionConfig object for topics
 */
export const topicsCollection: (props?: Props) => CollectionConfig<'topics'> = (props) => {
  const { overrides, mediaCollectionSlug = 'media', coursesCollectionSlug = 'courses', quizzesCollectionSlug = 'quizzes', lessonsCollectionSlug = 'lessons' } = props || {}
  const fieldsOverride = overrides?.fields

  /**
   * Default fields for the topics collection
   * Includes topic content, media, video progression, and assessment relationships
   */
  const defaultFields: Field[] = [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'The title of the topic',
      },
    },
    {
      name: 'excerpt',
      type: 'text',
      admin: {
        description: 'The excerpt of the topic',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description: 'The content of the topic',
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
        description: 'The featured image of the topic',
      },
    },
 
    embeddedVideo({
      mediaCollectionSlug,
      overrides: {
        name: 'topicVideo',
        access: {
          read: isAdminOrAuthorOrEnrolledInCourseFieldLevel,
        },
        admin: {
         description: 'The video content for this topic',
        },
      },
    }),
    videoProgression({
      overrides: {
        admin: {
          condition: (data, { topicVideo }) => Boolean(topicVideo.embed),
        },
        access: {
          read: isAdminOrAuthorOrEnrolledInCourseFieldLevel,
        },
      },
    }),
    {
      name: 'topicMaterials',
      type: 'richText',
      label: 'Topic Materials',
      admin: {
        description: 'Additional materials and resources for the topic',
      },
      access: {
        read: isAdminOrAuthorOrEnrolledInCourseFieldLevel,
      }, 
    },
    {
      name: 'course',
      type: 'relationship',
      relationTo: coursesCollectionSlug,
      admin: {
        position: 'sidebar',
        allowCreate: false,
        description: 'The course that the topic is associated with',
      },
    },
    {
      name: 'lesson',
      type: 'relationship',
      relationTo: lessonsCollectionSlug,
      admin: {
        position: 'sidebar',
        allowCreate: false,
        description: 'The lesson that the topic is associated with',
      },
    }, 
  ]

  // Apply field overrides if provided
  const fields =
  fieldsOverride && typeof fieldsOverride === 'function'
    ? fieldsOverride({ defaultFields })
    : defaultFields

  /**
   * Base configuration for the topics collection
   * Includes slug, access control, timestamps, and admin settings
   */
  const baseConfig: CollectionConfig = {
    slug: 'topics',
    access: {
      create: isAdminOrAuthor,
      read: isAdminOrPublished,
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