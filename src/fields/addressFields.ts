import type { ArrayField, Field } from 'payload'

import { countryOptions } from '../exports/helpers.js'
import { deepMerge } from '../exports/utilities.js'

type AddressType = (options?: { overrides?: Partial<ArrayField> }) => Field

export const address: AddressType = ({ overrides = {} } = {}) => {
  const generatedAddress: Field = {
    name: 'address',
    type: 'group',
    admin: {
      hideGutter: true,
    },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'firstName',
            type: 'text',
            admin: {
              width: '50%',
            },
            label: 'First Name',
          },
          {
            name: 'lastName',
            type: 'text',
            admin: {
              width: '50%',
            },
            label: 'Last Name',
          },
          {
            name: 'company',
            type: 'text',
            admin: {
              width: '100%',
            },
            label: 'Company',
          },
          {
            name: 'addressLineOne',
            type: 'text',
            admin: {
              width: '100%',
            },
            label: 'Address Line 1',
          },
          {
            name: 'addressLineTwo',
            type: 'text',
            admin: {
              width: '100%',
            },
            label: 'Address Line 2',
          },
          {
            name: 'city',
            type: 'text',
            admin: {
              width: '33.33%',
            },
            label: 'City',
          },
          {
            name: 'state',
            type: 'text',
            admin: {
              width: '33.33%',
            },
            label: 'State',
          },
          {
            name: 'postcode',
            type: 'text',
            admin: {
              width: '33.33%',
            },
            label: 'Postcode',
          },
          {
            name: 'country',
            type: 'select',
            admin: {
              width: '33.33%',
            },
            defaultValue: 'AU',
            options: countryOptions,
          },
        ],
      },
    ],
    interfaceName: 'Address',
  }

  return deepMerge(generatedAddress, overrides)
}
