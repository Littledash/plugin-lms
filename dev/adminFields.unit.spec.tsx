/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'

const setValue = jest.fn()
const dispatchFields = jest.fn()

const hooks = {
  disabled: false,
  dispatchFields,
  fields: {} as Record<string, { value?: unknown }>,
  path: 'correctAnswer',
  readOnly: false,
  row: { amount: 0, currency: 'AUD' },
  setValue,
  showError: false,
  value: undefined as unknown,
}

// Names match Payload's hooks so the components can be rendered without the admin app.
/* eslint-disable @eslint-react/hooks-extra/no-useless-custom-hooks */
await jest.unstable_mockModule('@payloadcms/ui', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick: React.MouseEventHandler }) => (
    <button onClick={onClick} type="button">{children}</button>
  ),
  FieldLabel: ({ label }: { label?: React.ReactNode }) => <span>{label}</span>,
  SelectInput: ({
    label,
    onChange,
    options,
    readOnly,
    value,
  }: {
    label?: string
    onChange: (option: { label: string; value: string } | null) => void
    options: { label: string; value: string }[]
    readOnly?: boolean
    value?: string
  }) => (
    <select
      aria-label={label}
      disabled={readOnly}
      onChange={(event) => {
        const selected = options.find((option) => option.value === event.target.value) ?? null
        onChange(selected)
      }}
      value={value ?? ''}
    >
      <option value="">Choose</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  ),
  TextInput: ({
    onChange,
    readOnly,
    value,
  }: {
    onChange: (value: string) => void
    readOnly?: boolean
    value?: string
  }) => (
    <input
      aria-label="slug"
      onChange={(event) => onChange(event.target.value)}
      readOnly={readOnly}
      value={value ?? ''}
    />
  ),
  useField: () => hooks,
  useForm: () => ({ dispatchFields: hooks.dispatchFields }),
  useFormFields: (selector: (state: [typeof hooks.fields]) => unknown) => selector([hooks.fields]),
  useRowLabel: () => ({ data: hooks.row }),
}))
/* eslint-enable @eslint-react/hooks-extra/no-useless-custom-hooks */

const { TrueFalseAnswer } = await import('../src/ui/TrueFalseAnswer/index.js')
const { SlugInput } = await import('../src/ui/SlugInput/index.js')
const { PriceInput } = await import('../src/ui/PriceInput/index.js')
const { PriceRowLabel } = await import('../src/ui/PriceRowLabel/index.js')
const { formatSlugHook } = await import('../src/ui/SlugInput/formatSlug.js')

const currencies = {
  defaultCurrency: 'AUD',
  supportedCurrencies: [
    { code: 'AUD', decimals: 2, label: 'Australian Dollar', symbol: 'A$' },
    { code: 'USD', decimals: 2, label: 'US Dollar', symbol: '$' },
  ],
}

describe('admin field components', () => {
  beforeEach(() => {
    setValue.mockReset()
    dispatchFields.mockReset()
    hooks.disabled = false
    hooks.value = undefined
    hooks.fields = {}
    hooks.row = { amount: 2500, currency: 'AUD' }
  })

  it('writes the chosen true/false answer', () => {
    hooks.value = 'true'
    render(
      <TrueFalseAnswer
        field={{ name: 'correctAnswer', admin: { description: 'Pick one' }, label: 'Correct answer' }}
        path="correctAnswer"
      />,
    )

    expect(screen.getByRole('option', { name: 'True' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'False' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Both' })).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Correct answer'), { target: { value: 'both' } })
    expect(setValue).toHaveBeenCalledWith('both')
  })

  it('ignores a true/false change when the field is read only', () => {
    hooks.value = 'true'
    render(<TrueFalseAnswer field={{ name: 'correctAnswer', label: 'Correct answer' }} path="correctAnswer" readOnly />)

    fireEvent.change(screen.getByLabelText('Correct answer'), { target: { value: 'false' } })
    expect(setValue).not.toHaveBeenCalled()
  })

  it('copies the title into the slug while the slug is locked', async () => {
    hooks.path = 'slug'
    hooks.value = ''
    hooks.fields = {
      slugLock: { value: true },
      title: { value: 'Hello, World!' },
    }

    render(
      <SlugInput
        checkboxFieldPath="slugLock"
        field={{ name: 'slug', label: 'Slug' }}
        fieldToUse="title"
        path="slug"
      />,
    )

    await waitFor(() => expect(setValue).toHaveBeenCalledWith('hello-world'))
    expect(screen.getByRole('button', { name: 'Unlock' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }))
    expect(dispatchFields).toHaveBeenCalledWith({ type: 'UPDATE', path: 'slugLock', value: false })
  })

  it('formats a missing slug from the title on create', () => {
    const format = formatSlugHook('title')
    expect(format({ data: { title: 'Hello World' }, operation: 'create', value: undefined })).toBe('hello-world')
    expect(format({ data: { title: 'Ignored' }, operation: 'update', value: 'keep-me' })).toBe('keep-me')
  })

  it('shows a price in dollars and stores cents when the field blurs', async () => {
    hooks.value = 2500
    hooks.fields = { 'prices.0.currency': { value: 'AUD' } }

    render(
      <PriceInput
        currenciesConfig={currencies}
        field={{ name: 'amount', label: 'Amount' }}
        path="prices.0.amount"
      />,
    )

    const input = await screen.findByPlaceholderText('0.00')
    expect((input as HTMLInputElement).value).toBe('25.00')
    expect(screen.getByText('A$')).toBeTruthy()

    fireEvent.change(input, { target: { value: '10.50' } })
    fireEvent.blur(input)
    expect(setValue).toHaveBeenCalledWith(1050)
    expect((input as HTMLInputElement).value).toBe('10.50')
  })

  it('rejects letters in a price', async () => {
    hooks.value = 2500
    hooks.fields = { 'prices.0.currency': { value: 'AUD' } }

    render(
      <PriceInput
        currenciesConfig={currencies}
        field={{ name: 'amount', label: 'Amount' }}
        path="prices.0.amount"
      />,
    )

    const input = await screen.findByPlaceholderText('0.00')
    fireEvent.change(input, { target: { value: 'abc' } })
    expect((input as HTMLInputElement).value).toBe('25.00')
    expect(setValue).not.toHaveBeenCalled()
  })

  it('labels a price row with its currency, or the default currency', () => {
    const { rerender } = render(<PriceRowLabel currenciesConfig={currencies} />)
    expect(screen.getByText('A$25.00')).toBeTruthy()
    expect(screen.getByText('(AUD)')).toBeTruthy()

    hooks.row = { amount: 900, currency: 'USD' }
    rerender(<PriceRowLabel currenciesConfig={currencies} />)
    expect(screen.getByText('$9.00')).toBeTruthy()
    expect(screen.getByText('(USD)')).toBeTruthy()

    hooks.row = { amount: 500, currency: '' }
    rerender(<PriceRowLabel currenciesConfig={currencies} />)
    expect(screen.getByText('A$5.00')).toBeTruthy()
  })
})
