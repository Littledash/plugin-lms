import type { CollectionConfig, Field } from 'payload'
import type { CountryType, FieldsOverride } from '../types.js'
type Props = {
  /**
   * Array of fields used for capturing the address data. Use this over overrides to customise the fields here as it's reused across the plugin.
   */
  addressFields: Field[]
  /**
   * Slug of the students collection, defaults to 'users'.
   */
  studentsCollectionSlug?: string
  overrides?: {
    fields?: FieldsOverride
  } & Partial<Omit<CollectionConfig, 'fields'>>
  supportedCountries?: CountryType[]
}
export declare const addressesCollection: (props: Props) => CollectionConfig
export {}
