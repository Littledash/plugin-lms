import type { NumberFieldClientProps } from 'payload';
import './index.scss';
import type { CurrenciesConfig } from '../../types.js';
type Props = {
    currenciesConfig: CurrenciesConfig;
    path: string;
} & NumberFieldClientProps;
export declare const PriceInput: React.FC<Props>;
export {};
