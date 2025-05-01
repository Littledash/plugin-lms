import { CollectionConfig, Field } from 'payload';
import { FieldsOverride } from '../types.js';
import { slugField } from '../fields/slug.js';
import { anyone } from '../access/anyone.js';
import { isAdminOrLoggedIn } from '../access/isAdminOrLoggedIn.js';
import { isAdminOrSelf } from '../access/isAdminOrSelf.js';
/**
 * Props interface for configuring the categories collection
 * @property overrides - Optional configuration overrides for fields and collection settings
 */
type Props = {
    overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}

/**
 * Creates a categories collection configuration for Payload CMS
 * This collection manages course categories for organizing and filtering courses
 * 
 * @param props - Configuration properties for the categories collection
 * @returns CollectionConfig object for categories
 */
export const categoriesCollection: (props?: Props) => CollectionConfig<'categories'> = (props) => {
  const { overrides } = props || {}
  const fieldsOverride = overrides?.fields

  /**
   * Default fields for the categories collection
   * Includes title and slug fields for category identification and URL generation
   */
  const defaultFields: Field[] = [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'The title of the category',
      },
    },
    ...slugField(),
  ]

  // Apply field overrides if provided
  const fields =
  fieldsOverride && typeof fieldsOverride === 'function'
    ? fieldsOverride({ defaultFields })
    : defaultFields

  /**
   * Base configuration for the categories collection
   * Includes slug, access control, timestamps, and admin settings
   */
  const baseConfig: CollectionConfig = {
    slug: 'categories',
    access: {
      create: isAdminOrLoggedIn,
      read: anyone,
      update: isAdminOrSelf,
      delete: isAdminOrSelf,
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
