import { amountField } from './amountField.js';
import { currencyField } from './currencyField.js';
/**
 * Creates a field for managing multiple price points
 * @param props - Configuration overrides for the field
 * @returns A configured array field for prices
 */ export const pricesField = ({ currenciesConfig, overrides })=>{
    const minRows = 1;
    const maxRows = currenciesConfig.supportedCurrencies.length ?? 1;
    const defaultCurrency = currenciesConfig.defaultCurrency ?? currenciesConfig.supportedCurrencies.length === 1 ? currenciesConfig.supportedCurrencies[0]?.code : undefined;
    const defaultValue = [
        {
            amount: 0,
            currency: defaultCurrency
        }
    ];
    const field = {
        name: 'prices',
        type: 'array',
        maxRows,
        minRows,
        ...defaultValue && {
            defaultValue
        },
        ...overrides,
        admin: {
            ...overrides?.admin,
            components: {
                RowLabel: {
                    clientProps: {
                        currenciesConfig
                    },
                    path: '@littledash/plugin-lms/ui/PriceRowLabel#PriceRowLabel'
                },
                ...overrides?.admin?.components
            },
            initCollapsed: true,
            readOnly: maxRows === minRows,
            description: 'The price points for this item'
        },
        fields: [
            amountField({
                currenciesConfig
            }),
            currencyField({
                currenciesConfig
            })
        ]
    };
    return field;
};

//# sourceMappingURL=pricesField.js.map