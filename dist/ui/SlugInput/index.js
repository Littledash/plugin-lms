'use client'
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'
import React, { useCallback, useEffect } from 'react'
import { useField, Button, TextInput, FieldLabel, useFormFields, useForm } from '@payloadcms/ui'
import { formatSlug } from './formatSlug.js'
import './index.scss'
export const SlugInput = ({
  field,
  fieldToUse,
  checkboxFieldPath: checkboxFieldPathFromProps,
  path,
  readOnly: readOnlyFromProps,
}) => {
  const { label } = field
  const checkboxFieldPath = path?.includes('.')
    ? `${path}.${checkboxFieldPathFromProps}`
    : checkboxFieldPathFromProps
  const { value, setValue } = useField({
    path: path || field.name,
  })
  const { dispatchFields } = useForm()
  // The value of the checkbox
  // We're using separate useFormFields to minimise re-renders
  const checkboxValue = useFormFields(([fields]) => {
    return fields[checkboxFieldPath]?.value
  })
  // The value of the field we're listening to for the slug
  const targetFieldValue = useFormFields(([fields]) => {
    return fields[fieldToUse]?.value
  })
  useEffect(() => {
    if (checkboxValue) {
      if (targetFieldValue) {
        const formattedSlug = formatSlug(targetFieldValue)
        if (value !== formattedSlug) setValue(formattedSlug)
      } else {
        if (value !== '') setValue('')
      }
    }
  }, [targetFieldValue, checkboxValue, setValue, value])
  const handleLock = useCallback(
    (e) => {
      e.preventDefault()
      dispatchFields({
        type: 'UPDATE',
        path: checkboxFieldPath,
        value: !checkboxValue,
      })
    },
    [checkboxValue, checkboxFieldPath, dispatchFields],
  )
  const readOnly = readOnlyFromProps || checkboxValue
  return /*#__PURE__*/ _jsxs('div', {
    className: 'field-type slug-field-component',
    children: [
      /*#__PURE__*/ _jsxs('div', {
        className: 'label-wrapper',
        children: [
          /*#__PURE__*/ _jsx(FieldLabel, {
            htmlFor: `field-${path}`,
            label: label,
          }),
          /*#__PURE__*/ _jsx(Button, {
            className: 'lock-button',
            buttonStyle: 'none',
            onClick: handleLock,
            children: checkboxValue ? 'Unlock' : 'Lock',
          }),
        ],
      }),
      /*#__PURE__*/ _jsx(TextInput, {
        value: value,
        onChange: setValue,
        path: path || field.name,
        readOnly: Boolean(readOnly),
      }),
    ],
  })
}

//# sourceMappingURL=index.js.map
