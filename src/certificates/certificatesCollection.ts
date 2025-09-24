import { CollectionConfig, Field } from 'payload'
import { FieldsOverride } from '../types.js'

/**
 * Props interface for configuring the certificates collection
 * @property coursesCollectionSlug - Slug for the courses collection (default: 'courses')
 * @property studentsCollectionSlug - Slug for the students collection (default: 'users')
 * @property mediaCollectionSlug - Slug for the media collection (default: 'media')
 * @property overrides - Optional configuration overrides for fields and collection settings
 */
type Props = {
  coursesCollectionSlug?: string
  studentsCollectionSlug?: string
  mediaCollectionSlug?: string
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}

/**
 * Creates a certificates collection configuration for Payload CMS
 * This collection manages digital certificates for course completion
 *
 * @param props - Configuration properties for the certificates collection
 * @returns CollectionConfig object for certificates
 */
export const certificatesCollection: (props?: Props) => CollectionConfig<'certificates'> = (
  props,
) => {
  const {
    overrides,
    coursesCollectionSlug = 'courses',
    studentsCollectionSlug = 'users',
    mediaCollectionSlug = 'media',
  } = props || {}
  const fieldsOverride = overrides?.fields

  /**
   * Default fields for the certificates collection
   * Includes title, description, template, course relationship, student relationships,
   * issue date, expiry date, certificate number, and status
   */
  const defaultFields: Field[] = [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'The title of the certificate',
      },
    },
    {
      name: 'description',
      type: 'richText',
      admin: {
        description: 'The description of the certificate',
      },
    },
    {
      name: 'template',
      type: 'upload',
      relationTo: mediaCollectionSlug,
      admin: {
        description: 'The certificate template image',
      },
    },
    {
      name: 'courses',
      type: 'relationship',
      relationTo: coursesCollectionSlug,
      hasMany: true,
      admin: {
        allowCreate: false,
        description: 'The courses this certificate is for',
      },
    },
    {
      name: 'expiryDate',
      type: 'date',
      admin: {
        description: 'The date the certificate expires (if applicable)',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Expired', value: 'expired' },
        { label: 'Revoked', value: 'revoked' },
      ],
      required: true,
      admin: {
        description: 'The status of the certificate',
      },
    },
    {
      name: 'authors',
      type: 'relationship',
      relationTo: studentsCollectionSlug,
      hasMany: true,
      admin: {
        allowCreate: false,
        description: 'The authors of the certificate',
      },
    },
  ]

  // Apply field overrides if provided
  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields })
      : defaultFields

  /**
   * Base configuration for the certificates collection
   * Includes slug, access control, timestamps, and admin settings
   */
  const baseConfig: CollectionConfig = {
    slug: 'certificates',
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
