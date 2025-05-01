import type { NumberField } from 'payload'
import type { CurrenciesConfig } from '../types.js'

/**
 * Props for the amount field configuration
 */
type Props = {
  currenciesConfig: CurrenciesConfig
  overrides?: Partial<NumberField>
}

/**
 * Creates a field for monetary amounts
 * @param props - Configuration overrides and currencies config
 * @returns A configured number field for amounts
 */
export const amountField: (props: Props) => NumberField = ({ currenciesConfig, overrides }) => {
  // @ts-expect-error - issue with payload types
  const field: NumberField = {
    name: 'amount',
    type: 'number',
    required: true,
    min: 0,
    admin: {
      description: 'The monetary amount',
    },
    ...overrides,
  }

  return field
}
