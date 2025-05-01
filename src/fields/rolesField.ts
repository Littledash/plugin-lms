import type { SelectField } from 'payload'

/**
 * Props for the roles field configuration
 */
type Props = {
  overrides?: Partial<SelectField>
}

/**
 * Available role options for the select field
 */
export const rolesOptions = [
  {
    label: 'Author',
    value: 'author',
  },
  {
    label: 'Student',
    value: 'student',
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

/**
 * Creates a select field for user roles
 * @param props - Configuration overrides for the field
 * @returns A configured select field for roles
 */
export const rolesField: (props: Props) => SelectField = ({ overrides }) => {
  // @ts-expect-error - issue with payload types
  const field: SelectField = {
    name: 'roles',
    type: 'select',
    defaultValue: ['student'],
    hasMany: true,
    options: rolesOptions,
    ...overrides,
    admin: { ...overrides?.admin },
  }

  return field
}
