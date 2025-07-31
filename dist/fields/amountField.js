/**
 * Creates a field for monetary amounts
 * @param props - Configuration overrides and currencies config
 * @returns A configured number field for amounts
 */ export const amountField = ({ currenciesConfig, overrides }) => {
  // @ts-expect-error - issue with payload types
  const field = {
    name: 'amount',
    type: 'number',
    ...overrides,
    admin: {
      components: {
        Field: {
          clientProps: {
            currenciesConfig,
          },
          path: '@littledash/plugin-lms/ui/PriceInput#PriceInput',
        },
        ...overrides?.admin?.components,
      },
      ...overrides?.admin,
    },
  }
  return field
}

//# sourceMappingURL=amountField.js.map
