'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { SelectInput, useField } from '@payloadcms/ui';
import { useCallback } from 'react';
import { trueFalseAnswerOptions } from '../../questions/trueFalseAnswers.js';
export const TrueFalseAnswer = ({ field, path: pathFromProps, readOnly })=>{
    const { disabled, path, setValue, showError, value } = useField({
        potentiallyStalePath: pathFromProps
    });
    const onChange = useCallback((selectedOption)=>{
        if (readOnly || disabled) {
            return;
        }
        const next = selectedOption && !Array.isArray(selectedOption) ? selectedOption.value : null;
        setValue(typeof next === 'string' ? next : null);
    }, [
        disabled,
        readOnly,
        setValue
    ]);
    return /*#__PURE__*/ _jsx(SelectInput, {
        description: typeof field.admin?.description === 'string' ? field.admin.description : undefined,
        isClearable: true,
        label: typeof field.label === 'string' ? field.label : 'Correct answer',
        name: field.name,
        onChange: onChange,
        options: [
            ...trueFalseAnswerOptions
        ],
        path: path,
        readOnly: Boolean(readOnly || disabled),
        required: field.required,
        showError: showError,
        value: typeof value === 'string' ? value : undefined
    });
};

//# sourceMappingURL=index.js.map