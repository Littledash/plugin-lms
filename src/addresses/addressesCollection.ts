import type { CollectionBeforeChangeHook, CollectionConfig, Field } from 'payload'

import type { CountryType, FieldsOverride } from '../types.js'

import { checkRole } from '../access/checkRole.js'
import { defaultAccess, withDefaultAccess } from '../access/defaultAccess.js'
import { isAdminFieldLevel } from '../access/isAdmin.js'
import { toId } from '../services/shared.js'
import { defaultCountries } from './defaultCountries.js'

/**
 * Students can create and edit their own addresses, but the owner is always the logged-in user.
 * Admins may set `customer` to someone else.
 */
const forceAddressCustomer: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  if (checkRole(['admin'], req.user)) {return data}
  const ownerId = req.user?.id
  if (ownerId === undefined) {return data}
  return {
    ...data,
    customer: originalDoc ? (toId(originalDoc.customer) ?? ownerId) : ownerId,
  }
}

type Props = {
  /**
   * Array of fields used for capturing the address data. Use this over overrides to customise the fields here as it's reused across the plugin.
   */
  addressFields: Field[]
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  /**
   * Slug of the students collection, defaults to 'users'.
   */
  studentsCollectionSlug?: string
  supportedCountries?: CountryType[]
}

export const addressesCollection: (props: Props) => CollectionConfig = (props) => {
  const { addressFields, overrides, studentsCollectionSlug = 'users' } = props || {}
  const fieldsOverride = overrides?.fields

  const { supportedCountries: supportedCountriesFromProps } = props || {}
  const supportedCountries = supportedCountriesFromProps || defaultCountries
  const hasOnlyOneCountry = supportedCountries && supportedCountries.length === 1

  const defaultFields: Field[] = [
    {
      name: 'customer',
      type: 'relationship',
      access: {
        create: isAdminFieldLevel,
        update: isAdminFieldLevel,
      },
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
    access: withDefaultAccess(defaultAccess.addresses, overrides?.access),
    admin: {
      useAsTitle: 'createdAt',
      ...overrides?.admin,
    },
    fields,
    hooks: {
      ...overrides?.hooks,
      beforeChange: [forceAddressCustomer, ...(overrides?.hooks?.beforeChange || [])],
    },
  }

  return { ...baseConfig }
}
