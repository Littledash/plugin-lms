'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useField, useFormFields } from '@payloadcms/ui';
import './index.scss';
import { FormattedInput } from './FormattedInput.js';
export const PriceInput = (args)=>{
    const { currenciesConfig, field: { label }, path } = args;
    const { setValue, value } = useField({
        path
    });
    const parentPath = path.split('.').slice(0, -1).join('.');
    const currencyPath = parentPath ? `${parentPath}.currency` : 'currency';
    const currency = useFormFields(([fields])=>fields[currencyPath]);
    return /*#__PURE__*/ _jsx(FormattedInput, {
        currency: currency?.value,
        label: label,
        onChange: (value)=>setValue(value),
        supportedCurrencies: currenciesConfig?.supportedCurrencies,
        value: value || 0
    });
};

//# sourceMappingURL=index.js.map