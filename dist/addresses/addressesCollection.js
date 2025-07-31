import { defaultCountries } from './defaultCountries.js'
export const addressesCollection = (props) => {
  const { addressFields, studentsCollectionSlug = 'users', overrides } = props || {}
  const fieldsOverride = overrides?.fields
  const { supportedCountries: supportedCountriesFromProps } = props || {}
  const supportedCountries = supportedCountriesFromProps || defaultCountries
  const hasOnlyOneCountry = supportedCountries && supportedCountries.length === 1
  const defaultFields = [
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
        }
      }
      return field
    }),
  ]
  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({
          defaultFields,
        })
      : defaultFields
  const baseConfig = {
    slug: 'addresses',
    timestamps: true,
    ...overrides,
    admin: {
      useAsTitle: 'createdAt',
      ...overrides?.admin,
    },
    fields,
  }
  return {
    ...baseConfig,
  }
}

//# sourceMappingURL=addressesCollection.js.map
