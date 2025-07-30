import type { CollectionConfig, Field } from 'payload'

import type { CountryType, FieldsOverride } from '../types.js'

import { defaultCountries } from './defaultCountries.js'

type Props = {
  /**
   * Array of fields used for capturing the address data. Use this over overrides to customise the fields here as it's reused across the plugin.
   */
  addressFields: Field[]
  /**
   * Slug of the students collection, defaults to 'users'.
   */
  studentsCollectionSlug?: string
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  supportedCountries?: CountryType[]
}

export const addressesCollection: (props: Props) => CollectionConfig = (props) => {
  const { addressFields, studentsCollectionSlug = 'users', overrides } = props || {}
  const fieldsOverride = overrides?.fields

  const { supportedCountries: supportedCountriesFromProps } = props || {}
  const supportedCountries = supportedCountriesFromProps || defaultCountries
  const hasOnlyOneCountry = supportedCountries && supportedCountries.length === 1

  const defaultFields: Field[] = [
    {
      name: 'customer',
      type: 'relationship',
      label: 'Student',
      relationTo: studentsCollectionSlug,
    },
    ...addressFields.map((field) => {
      if ('name' in field && field.name === 'country') {
        return {
          name: 'country',
          type: 'select',
          label: 'Country',
          options: supportedCountries || defaultCountries,
          required: true,
          ...(supportedCountries && supportedCountries?.[0] && hasOnlyOneCountry
            ? {
                defaultValue: supportedCountries?.[0].value,
              }
            : {}),
        } as Field
      }

      return field
    }),
  ]

  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields })
      : defaultFields

  const baseConfig: CollectionConfig = {
    slug: 'addresses',
    timestamps: true,
    ...overrides,
    admin: {
      useAsTitle: 'createdAt',
      ...overrides?.admin,
    },
    fields,
  }

  return { ...baseConfig }
}