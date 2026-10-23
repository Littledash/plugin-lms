'use client'
import type { TextFieldClientComponent } from 'payload'

import { SelectInput, useField } from '@payloadcms/ui'
import { useCallback } from 'react'

import { trueFalseAnswerOptions } from '../../questions/trueFalseAnswers.js'

export const TrueFalseAnswer: TextFieldClientComponent = ({ field, path: pathFromProps, readOnly }) => {
  const { disabled, path, setValue, showError, value } = useField<string>({
    potentiallyStalePath: pathFromProps,
  })

  const onChange = useCallback(
    (selectedOption: Parameters<NonNullable<React.ComponentProps<typeof SelectInput>['onChange']>>[0]) => {
      if (readOnly || disabled) {
        return
      }
      const next = selectedOption && !Array.isArray(selectedOption) ? selectedOption.value : null
      setValue(typeof next === 'string' ? next : null)
    },
    [disabled, readOnly, setValue],
  )

  return (
    <SelectInput
      description={typeof field.admin?.description === 'string' ? field.admin.description : undefined}
      isClearable
      label={typeof field.label === 'string' ? field.label : 'Correct answer'}
      name={field.name}
      onChange={onChange}
      options={[...trueFalseAnswerOptions]}
      path={path}
      readOnly={Boolean(readOnly || disabled)}
      required={field.required}
      showError={showError}
      value={typeof value === 'string' ? value : undefined}
    />
  )
}
