import { countryOptions } from '../exports/helpers.js'
import { deepMerge } from '../exports/utilities.js'

import type { ArrayField, Field } from 'payload'

type AddressType = (options?: { overrides?: Partial<ArrayField> }) => Field

export const address: AddressType = ({ overrides = {} } = {}) => {
  const generatedAddress: Field = {
    name: 'address',
    type: 'group',
    interfaceName: 'Address',
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'addressLineOne',
            type: 'text',
            label: 'Address Line 1',
            admin: {
              width: '100%',
            },
          },
          {
            name: 'addressLineTwo',
            type: 'text',
            label: 'Address Line 2',
            admin: {
              width: '100%',
            },
          },
          {
            name: 'city',
            type: 'text',
            label: 'City',
            admin: {
              width: '33.33%',
            },
          },
          {
            name: 'state',
            type: 'text',
            label: 'State',
            admin: {
              width: '33.33%',
            },
          },
          {
            name: 'postcode',
            type: 'text',
            label: 'Postcode',
            admin: {
              width: '33.33%',
            },
          },
          {
            name: 'country',
            type: 'select',
            options: countryOptions,
            defaultValue: 'AU',
            admin: {
              width: '33.33%',
            },
          },
        ],
      },
    ],
    admin: {
      hideGutter: true,
    },
  }

  return deepMerge(generatedAddress, overrides)
}
