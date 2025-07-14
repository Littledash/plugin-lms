'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FieldLabel } from '@payloadcms/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AUD } from '../../currencies/index.js';
import { convertFromBaseValue, convertToBaseValue } from './utilities.js';
const baseClass = 'formattedPrice';
export const FormattedInput = ({ id, currency: currencyFromProps, disabled = false, label, onChange: onChangeFromProps, placeholder = '0.00', supportedCurrencies, value })=>{
    const [displayValue, setDisplayValue] = useState('');
    const inputRef = useRef(null);
    const isFirstRender = useRef(true);
    const debounceTimer = useRef(null);
    const currency = useMemo(()=>{
        if (currencyFromProps && supportedCurrencies) {
            const foundCurrency = supportedCurrencies.find((supportedCurrency)=>supportedCurrency.code === currencyFromProps);
            return foundCurrency ?? AUD;
        }
        return AUD;
    }, [
        currencyFromProps,
        supportedCurrencies
    ]);
    useEffect(()=>{
        if (isFirstRender.current) {
            isFirstRender.current = false;
            setDisplayValue(convertFromBaseValue({
                baseValue: value,
                currency
            }));
        }
    }, [
        currency,
        value,
        currencyFromProps
    ]);
    const updateValue = useCallback((inputValue)=>{
        const baseValue = convertToBaseValue({
            currency,
            displayValue: inputValue
        });
        onChangeFromProps(baseValue);
    }, [
        currency,
        onChangeFromProps
    ]);
    const handleInputChange = (e)=>{
        const inputValue = e.target.value;
        if (!/^\d*(?:\.\d*)?$/.test(inputValue) && inputValue !== '') {
            return;
        }
        setDisplayValue(inputValue);
        // Clear any existing timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        // Only update the base value after a delay to avoid formatting while typing
        debounceTimer.current = setTimeout(()=>{
            updateValue(inputValue);
        }, 500);
    };
    const handleInputBlur = ()=>{
        if (displayValue === '') {
            return;
        }
        // Clear any pending debounce
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
            debounceTimer.current = null;
        }
        const baseValue = convertToBaseValue({
            currency,
            displayValue
        });
        const formattedValue = convertFromBaseValue({
            baseValue,
            currency
        });
        if (value != baseValue) {
            onChangeFromProps(baseValue);
        }
        setDisplayValue(formattedValue);
    };
    return /*#__PURE__*/ _jsxs("div", {
        className: `field-type number ${baseClass}`,
        children: [
            label && /*#__PURE__*/ _jsx(FieldLabel, {
                htmlFor: id,
                label: label
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: `${baseClass}Container`,
                children: [
                    /*#__PURE__*/ _jsx("div", {
                        className: `${baseClass}CurrencySymbol`,
                        children: /*#__PURE__*/ _jsx("span", {
                            children: currency.symbol
                        })
                    }),
                    /*#__PURE__*/ _jsx("input", {
                        className: `${baseClass}Input`,
                        disabled: disabled,
                        id: id,
                        onBlur: handleInputBlur,
                        onChange: handleInputChange,
                        placeholder: placeholder,
                        ref: inputRef,
                        type: "text",
                        value: displayValue
                    })
                ]
            })
        ]
    });
};

//# sourceMappingURL=FormattedInput.js.map