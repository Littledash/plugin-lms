import type { Field } from 'payload'

export const defaultAddressFields: () => Field[] = () => {
  return [
    {
      type: 'row',
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: {
            description: 'Optional, such as Mr, Ms or Dr.',
            width: '100%',
          },
          label: 'Title',
        },
        {
          name: 'firstName',
          type: 'text',
          admin: {
            description: 'First name of the person at this address.',
            width: '50%',
          },
          label: 'First name',
        },
        {
          name: 'lastName',
          type: 'text',
          admin: {
            description: 'Last name of the person at this address.',
            width: '50%',
          },
          label: 'Last name',
        },
        {
          name: 'company',
          type: 'text',
          admin: {
            description: 'Optional business or organisation name.',
            width: '100%',
          },
          label: 'Company',
        },
        {
          name: 'addressLine1',
          type: 'text',
          admin: {
            description: 'Street number and name.',
            width: '100%',
          },
          label: 'Address line 1',
        },
        {
          name: 'addressLine2',
          type: 'text',
          admin: {
            description: 'Optional unit, suite, floor or building.',
            width: '100%',
          },
          label: 'Address line 2',
        },
        {
          name: 'city',
          type: 'text',
          admin: {
            description: 'City or suburb.',
            width: '33.33%',
          },
          label: 'City',
        },
        {
          name: 'state',
          type: 'text',
          admin: {
            description: 'State, territory or region.',
            width: '33.33%',
          },
          label: 'State',
        },
        {
          name: 'postalCode',
          type: 'text',
          admin: {
            description: 'Postcode or ZIP code.',
            width: '33.33%',
          },
          label: 'Postal code',
        },
        {
          name: 'country',
          type: 'text',
          admin: {
            description: 'The country of the address.',
            width: '100%',
          },
          label: 'Country',
        },
        {
          name: 'phone',
          type: 'text',
          admin: {
            description: 'A contact number for this address, including the area code.',
            width: '100%',
          },
          label: 'Phone',
        },
      ],
    },
  ]
}
