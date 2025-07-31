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
export declare const amountField: (props: Props) => NumberField
export {}
