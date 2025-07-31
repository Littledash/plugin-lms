import type { ArrayField } from 'payload'
import type { CurrenciesConfig } from '../types.js'
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
export declare const pricesField: (props: Props) => ArrayField
export {}
