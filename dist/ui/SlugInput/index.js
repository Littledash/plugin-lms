'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, FieldLabel, TextInput, useField, useForm, useFormFields } from '@payloadcms/ui';
import React, { useCallback, useEffect } from 'react';
import { formatSlug } from './formatSlug.js';
import './index.scss';
export const SlugInput = ({ checkboxFieldPath: checkboxFieldPathFromProps, field, fieldToUse, path, readOnly: readOnlyFromProps })=>{
    const { label } = field;
    const checkboxFieldPath = path?.includes('.') ? `${path}.${checkboxFieldPathFromProps}` : checkboxFieldPathFromProps;
    const { setValue, value } = useField({
        path: path || field.name
    });
    const { dispatchFields } = useForm();
    // The value of the checkbox
    // We're using separate useFormFields to minimise re-renders
    const checkboxValue = useFormFields(([fields])=>{
        return fields[checkboxFieldPath]?.value;
    });
    // The value of the field we're listening to for the slug
    const targetFieldValue = useFormFields(([fields])=>{
        return fields[fieldToUse]?.value;
    });
    useEffect(()=>{
        if (checkboxValue) {
            if (targetFieldValue) {
                const formattedSlug = formatSlug(targetFieldValue);
                if (value !== formattedSlug) {
                    setValue(formattedSlug);
                }
            } else {
                if (value !== '') {
                    setValue('');
                }
            }
        }
    }, [
        targetFieldValue,
        checkboxValue,
        setValue,
        value
    ]);
    const handleLock = useCallback((e)=>{
        e.preventDefault();
        dispatchFields({
            type: 'UPDATE',
            path: checkboxFieldPath,
            value: !checkboxValue
        });
    }, [
        checkboxValue,
        checkboxFieldPath,
        dispatchFields
    ]);
    const readOnly = readOnlyFromProps || checkboxValue;
    return /*#__PURE__*/ _jsxs("div", {
        className: "field-type slug-field-component",
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "label-wrapper",
                children: [
                    /*#__PURE__*/ _jsx(FieldLabel, {
                        htmlFor: `field-${path}`,
                        label: label
                    }),
                    /*#__PURE__*/ _jsx(Button, {
                        buttonStyle: "none",
                        className: "lock-button",
                        onClick: handleLock,
                        children: checkboxValue ? 'Unlock' : 'Lock'
                    })
                ]
            }),
            /*#__PURE__*/ _jsx(TextInput, {
                onChange: setValue,
                path: path || field.name,
                readOnly: Boolean(readOnly),
                value: value
            })
        ]
    });
};

//# sourceMappingURL=index.js.map