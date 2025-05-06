import type { ArrayField } from 'payload'

import type { CurrenciesConfig } from '../types.js'

import { amountField } from './amountField.js'
import { currencyField } from './currencyField.js'

/**
 * Props for the prices field configuration
 */
type Props = {
  /**
   * Use this to specify a path for the condition.
   */
  conditionalPath?: string
  currenciesConfig: CurrenciesConfig
  overrides?: Partial<ArrayField>
}

/**
 * Creates a field for managing multiple price points
 * @param props - Configuration overrides for the field
 * @returns A configured array field for prices
 */
export const pricesField: (props: Props) => ArrayField = ({ currenciesConfig, overrides }) => {
  const minRows = 1
  const maxRows = currenciesConfig.supportedCurrencies.length ?? 1

  const defaultCurrency =
    (currenciesConfig.defaultCurrency ?? currenciesConfig.supportedCurrencies.length === 1)
      ? currenciesConfig.supportedCurrencies[0]?.code
      : undefined

  const defaultValue = [
    {
      amount: 0,
      currency: defaultCurrency,
    },
  ]

  const field: ArrayField = {
    name: 'prices',
    type: 'array',
    maxRows,
    minRows,
    ...(defaultValue && { defaultValue }),
    ...overrides,
    admin: {
      components: {
        RowLabel: {
          clientProps: {
            currenciesConfig,
          },
          path: '../src/ui/PriceRowLabel#PriceRowLabel',
        },
      },
      initCollapsed: true,
      readOnly: maxRows === minRows,
      description: 'The price points for this item',
    },
    fields: [amountField({ currenciesConfig }), currencyField({ currenciesConfig })],
  }

  return field
}
