import type { SelectField } from 'payload'

import type { CurrenciesConfig } from '../types.js'

/**
 * Props for the currency field configuration
 */
type Props = {
  currenciesConfig: CurrenciesConfig
  overrides?: Partial<SelectField>
}

/**
 * Creates a field for currency selection
 * @param props - Configuration overrides and currencies config
 * @returns A configured select field for currencies
 */
export const currencyField: (props: Props) => SelectField = ({ currenciesConfig, overrides }) => {
  const options = currenciesConfig.supportedCurrencies.map((currency) => {
    const label = currency.label ? `${currency.label} (${currency.code})` : currency.code

    return {
      label,
      value: currency.code,
    }
  })

  const defaultValue =
    (currenciesConfig.defaultCurrency ?? currenciesConfig.supportedCurrencies.length === 1)
      ? currenciesConfig.supportedCurrencies[0]?.code
      : undefined

  // @ts-expect-error - issue with payload types
  const field: SelectField = {
    name: 'currency',
    type: 'select',
    ...(defaultValue && { defaultValue }),
    options,
    ...overrides,
    admin: { readOnly: currenciesConfig.supportedCurrencies.length === 1, ...overrides?.admin },
  }

  return field
}
