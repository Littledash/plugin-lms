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
export declare const currencyField: (props: Props) => SelectField
export {}
