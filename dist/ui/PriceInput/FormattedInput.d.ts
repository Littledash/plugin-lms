import type { StaticLabel } from 'payload';
import type { Currency } from '../../types.js';
interface Props {
    currency: string;
    description?: string;
    disabled?: boolean;
    error?: string;
    id?: string;
    label?: StaticLabel;
    onChange: (value: number) => void;
    path?: string;
    placeholder?: string;
    supportedCurrencies: Currency[];
    value: number;
}
export declare const FormattedInput: React.FC<Props>;
export {};
