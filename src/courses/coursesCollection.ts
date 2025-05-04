import { CollectionConfig, Field } from 'payload';
import { FieldsOverride } from '../types.js';
import type { CurrenciesConfig } from '../types.js';
import { pricesField } from '../fields/pricesField.js';
import { isAdminOrAuthor, isAdminOrAuthorFieldLevel } from '../access/isAdminOrAuthor.js';
import { isAdminOrAuthorOrStudentFieldLevel } from '../access/isAdminOrAuthorOrStudent.js';
import { isAdminOrAuthorOrEnrolledInCourseFieldLevel } from '../access/isAdminOrAuthorOrEnrolledInCourse.js';
import { isAdminOrPublished } from '../access/isAdminOrPublished.js';
/**
 * Props interface for configuring the courses collection
 * @property categoriesCollectionSlug - Slug for the categories collection (default: 'categories')
 * @property certificatesCollectionSlug - Slug for the certificates collection (default: 'certificates')
 * @property currenciesConfig - Configuration for supported currencies
 * @property lessonsCollectionSlug - Slug for the lessons collection (default: 'lessons')
 * @property mediaCollectionSlug - Slug for the media collection (default: 'media')
 * @property studentsCollectionSlug - Slug for the students collection (default: 'users')
 * @property tagsCollectionSlug - Slug for the tags collection (default: 'tags')
 * @property overrides - Optional configuration overrides for fields and collection settings
 */
type Props = {
    categoriesCollectionSlug?: string
    certificatesCollectionSlug?: string
    currenciesConfig?: CurrenciesConfig
    lessonsCollectionSlug?: string
    mediaCollectionSlug?: string
    studentsCollectionSlug?: string
    tagsCollectionSlug?: string
    overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}

/**
 * Creates a courses collection configuration for Payload CMS
 * This collection manages educational courses with various access modes, pricing, and content organization
 * 
 * @param props - Configuration properties for the courses collection
 * @returns CollectionConfig object for courses
 */
export const coursesCollection: (props?: Props) => CollectionConfig<'courses'> = (props) => {
  const { overrides, mediaCollectionSlug = 'media', lessonsCollectionSlug = 'lessons', categoriesCollectionSlug = 'categories', tagsCollectionSlug = 'tags', currenciesConfig, studentsCollectionSlug = 'users', certificatesCollectionSlug = 'certificates' } = props || {}
  const fieldsOverride = overrides?.fields

  /**
   * Default fields for the courses collection
   * Includes course details, access control, pricing, relationships, and content organization
   */
  const defaultFields: Field[] = [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'The title of the course',
      },
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      admin: {
        description: 'The description of the course',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      admin: {
        description: 'The excerpt of the course',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: mediaCollectionSlug,
      admin: {
        position: 'sidebar',
        description: 'The featured image of the course',
      },
    },
    {
      name: 'students',
      type: 'relationship',
      relationTo: studentsCollectionSlug,
      hasMany: true,
      admin: {
        description: 'The students enrolled in the course',
      },
      access: {
        read: isAdminOrAuthorFieldLevel,
      },
    },
    {
      name: 'accessMode',
      type: 'select',
      defaultValue: 'open',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Free', value: 'free' },
        { label: 'Buy Now', value: 'buy now' },
        { label: 'Recurring', value: 'recurring' },
        { label: 'Closed', value: 'closed' },
      ],
      required: true,
      admin: {
        description: 'Controls how students gain access to the course',
      },
    },
    ...( currenciesConfig ? [pricesField({ currenciesConfig, overrides: { admin: { condition: (_, siblingData) => ['buy now', 'recurring', 'closed'].includes(siblingData?.accessMode) } } })] : []),
    {
      name: 'enrollmentUrl',
      type: 'text',
      admin: {
        description: 'The URL for the enrollment page',
        condition: (_, siblingData) => siblingData?.accessMode === 'closed',
      },
    },
    {
      name: 'accessExpirationDays',
      type: 'number',
      admin: {
        description: 'The number of days after which the access to the course will expire',
      },
    },
    {
      name: 'prerequisiteCourses',
      type: 'relationship',
      relationTo: 'courses',
      hasMany: true,
      admin: {
        allowCreate: false,
        description: 'Courses that a student must complete before enrolling in this course.',
      },
    },
    {
      name: 'requiredPoints',
      type: 'number',
      admin: {
        description: 'The points that are required to access this course',
      },
    },
    {
      name: 'coursePoints',
      type: 'number',
      label: 'Course completion points',
      admin: {
        description: 'The points that are awarded to the students who complete the course',
      },
    },
    {
      name: 'navigationMode',
      type: 'select',
      label: 'Course Navigation Mode',
      options: [
        { label: 'Linear', value: 'linear' },
        { label: 'Free Form', value: 'free' },
      ],
      admin: {
        description: 'Controls how students interact with the content and their navigational experience',
      },
    },
    {
      name: 'courseMaterials',
      type: 'richText',
      admin: {
        description: 'The materials that are part of the course',
      },
      access: {
        read: isAdminOrAuthorOrEnrolledInCourseFieldLevel,
      },
    },
    {
      name: 'duration',
      type: 'group',
      fields: [
       {
        type: 'row',
        fields: [
          {
            name: 'hours',
            type: 'number',
            label: 'hour(s)',
            admin: {
              description: 'The number of hours in the course',
              width: '50%',
            },
          },
          {
            name: 'minutes',
            type: 'number',
            label: 'minute(s)',
            admin: {
              width: '50%',
              description: 'The number of minutes in the course',
            },
          },
        ],
       }
      ],
      admin: {
        description: 'The duration of the course',
      },
    },
    {
      name: 'certificate',
      type: 'relationship',
      relationTo: certificatesCollectionSlug,
      hasMany: false,
      admin: {
        description: 'The certificate that is awarded to the students who complete the course',
      },
    },
    {
      name: 'lessons',
      type: 'relationship',
      relationTo: lessonsCollectionSlug,
      hasMany: true,
      admin: {
        allowCreate: false,
        description: 'The lessons that are part of the course',
      },
      access: {
        // No access control for the lessons field
        read: isAdminOrAuthorOrStudentFieldLevel,
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: categoriesCollectionSlug,
      hasMany: true,
      admin: {
        allowCreate: false,
        description: 'The categories that are part of the course',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: tagsCollectionSlug,
      hasMany: true,
      admin: {
        allowCreate: false,
        description: 'The tags that are part of the course',
      },
    }
  ]

  // Apply field overrides if provided
  const fields =
  fieldsOverride && typeof fieldsOverride === 'function'
    ? fieldsOverride({ defaultFields })
    : defaultFields

  /**
   * Base configuration for the courses collection
   * Includes slug, access control, timestamps, and admin settings
   */
  const baseConfig: CollectionConfig = {
    slug: 'courses',
    access: {
      create: isAdminOrAuthor,
      delete: isAdminOrAuthor,
      read: isAdminOrPublished, // TODO not sure if everyone should be able to read courses
      update: isAdminOrAuthor,
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
