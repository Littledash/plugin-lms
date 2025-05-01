import type { SelectField } from 'payload'


type Props = {
  overrides?: Partial<SelectField>
}

export const rolesOptions = [
  {
    label: 'Author',
    value: 'author',
  },
  {
    label: 'Customer',
    value: 'customer',
  },
  {
    label: 'Contributor',
    value: 'contributor',
  },
  {
    label: 'Editor',
    value: 'editor',
  },
  {
    label: 'Subscriber',
    value: 'subscriber',
  },
  {
    label: 'Public',
    value: 'public',
  },
]

export const rolesField: (props: Props) => SelectField = ({ overrides }) => {

// @ts-expect-error - issue with payload types
  const field: SelectField = {
    name: 'roles',
    type: 'select',
    defaultValue: ['subscriber'],
    hasMany: true,
    options: rolesOptions,
    ...overrides,
    admin: { ...overrides?.admin },
  }

  return field
}
