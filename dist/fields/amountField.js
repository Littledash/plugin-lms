/**
 * Creates a field for monetary amounts
 * @param props - Configuration overrides and currencies config
 * @returns A configured number field for amounts
 */ export const amountField = ({ currenciesConfig, overrides })=>{
    // @ts-expect-error - issue with payload types
    const field = {
        name: 'amount',
        type: 'number',
        ...overrides,
        admin: {
            components: {
                Field: {
                    clientProps: {
                        currenciesConfig
                    },
                    path: '@littledash/plugin-lms/ui/PriceInput#PriceInput'
                },
                ...overrides?.admin?.components
            },
            description: 'The price, typed as you would write it, such as 49.95. Saved in cents.',
            ...overrides?.admin
        }
    };
    return field;
};

//# sourceMappingURL=amountField.js.map