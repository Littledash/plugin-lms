import { CollectionConfig, Field } from 'payload';
import { FieldsOverride } from '../types.js';
import type { CurrenciesConfig } from '../types.js';
import { pricesField } from '../fields/pricesField.js';
import { isAdminOrStudent } from '../access/isAdminOrStudent.js';
import { isAdminOrAuthor } from '../access/isAdminOrAuthor.js';
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


export const coursesCollection: (props?: Props) => CollectionConfig<'courses'> = (props) => {
  const { overrides, mediaCollectionSlug = 'media', lessonsCollectionSlug = 'lessons', categoriesCollectionSlug = 'categories', tagsCollectionSlug = 'tags', currenciesConfig, studentsCollectionSlug = 'users', certificatesCollectionSlug = 'certificates' } = props || {}
  const fieldsOverride = overrides?.fields

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
    },
    ...( currenciesConfig ? [pricesField({ currenciesConfig, overrides: { admin: { condition: (_, siblingData) => ['buy now', 'recurring', 'closed'].includes(siblingData?.accessMode) } } })] : []),
    {
      name: 'enrollmentUrl',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.accessMode === 'closed',
      },
    },
    {
      name: 'accessExpirationDays',
      type: 'number',
      label: 'Access Expiration (Days)',
    },
    {
      name: 'prerequisiteCourses',
      type: 'relationship',
      relationTo: 'courses',
      hasMany: true,
      admin: {
        allowCreate: false,
        description: 'The courses that are required to access this course',
      },
    },
    {
      name: 'requiredPoints',
      type: 'number',
    },
    {
      name: 'coursePoints',
      type: 'number',
    },
    {
      name: 'navigationMode',
      type: 'select',
      label: 'Course Navigation Mode',
      options: [
        { label: 'Linear', value: 'linear' },
        { label: 'Free Form', value: 'free' },
      ],
    },
    {
      name: 'courseMaterials',
      type: 'richText',
    },
    {
      name: 'certificate',
      type: 'relationship',
      relationTo: certificatesCollectionSlug,
      hasMany: false,
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

  const fields =
  fieldsOverride && typeof fieldsOverride === 'function'
    ? fieldsOverride({ defaultFields })
    : defaultFields

    const baseConfig: CollectionConfig = {
      slug: 'courses',
      access: {
        create: isAdminOrAuthor,
        delete: isAdminOrAuthor,
        read: isAdminOrStudent,
        update: isAdminOrAuthor,
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
