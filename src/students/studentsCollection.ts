import { CollectionConfig, Field } from 'payload'
import { FieldsOverride } from '../types.js'
import { mergeFields } from '../utilities/deepMerge.js'

/**
 * Props interface for configuring the courses collection
 * @property studentsCollectionSlug - Slug for the students collection (default: 'users')
 * @property certificatesCollectionSlug - Slug for the certificates collection (default: 'certificates')
 * @property overrides - Optional configuration overrides for fields and collection settings
 */
type Props = {
  /**
   * Array of fields used for capturing the students data. Use this over overrides to customise the fields here as it's reused across the plugin.
   */
  studentsFields: Field[]
  studentsCollectionSlug?: string
  certificatesCollectionSlug?: string
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}

/**
 * Creates a courses collection configuration for Payload CMS
 * This collection manages educational courses with various access modes, pricing, and content organization
 *
 * @param props - Configuration properties for the courses collection
 * @returns CollectionConfig object for courses
 */
export const studentsCollection: (props?: Props) => CollectionConfig = (props) => {
  const { overrides, studentsFields = [], studentsCollectionSlug = 'users' } = props || {}

  const fieldsOverride = overrides?.fields

  /**
   * Default fields for the courses collection
   * Includes course details, access control, pricing, relationships, and content organization
   */
  const defaultFields: Field[] = [...studentsFields]

  // Apply field overrides if provided
  let fields: Field[]
  
  if (fieldsOverride && typeof fieldsOverride === 'function') {
    // Get the user's fields
    const userFields = fieldsOverride({ defaultFields })
    // Merge user fields with default fields, avoiding duplicates
    fields = mergeFields(defaultFields, userFields)
  } else {
    fields = defaultFields
  }

  /**
   * Base configuration for the courses collection
   * Includes slug, access control, timestamps, and admin settings
   */
  const baseConfig: CollectionConfig = {
    slug: studentsCollectionSlug,
    timestamps: true,
    ...overrides,
    admin: {
      ...overrides?.admin,
    },
    fields,
  }

  return { ...baseConfig }
}
