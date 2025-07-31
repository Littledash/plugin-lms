import { countryOptions } from '../exports/helpers.js';
import { deepMerge } from '../exports/utilities.js';
export const address = ({ overrides = {} } = {})=>{
    const generatedAddress = {
        name: 'address',
        type: 'group',
        interfaceName: 'Address',
        fields: [
            {
                type: 'row',
                fields: [
                    {
                        name: 'firstName',
                        type: 'text',
                        label: 'First Name',
                        admin: {
                            width: '50%'
                        }
                    },
                    {
                        name: 'lastName',
                        type: 'text',
                        label: 'Last Name',
                        admin: {
                            width: '50%'
                        }
                    },
                    {
                        name: 'company',
                        type: 'text',
                        label: 'Company',
                        admin: {
                            width: '100%'
                        }
                    },
                    {
                        name: 'addressLineOne',
                        type: 'text',
                        label: 'Address Line 1',
                        admin: {
                            width: '100%'
                        }
                    },
                    {
                        name: 'addressLineTwo',
                        type: 'text',
                        label: 'Address Line 2',
                        admin: {
                            width: '100%'
                        }
                    },
                    {
                        name: 'city',
                        type: 'text',
                        label: 'City',
                        admin: {
                            width: '33.33%'
                        }
                    },
                    {
                        name: 'state',
                        type: 'text',
                        label: 'State',
                        admin: {
                            width: '33.33%'
                        }
                    },
                    {
                        name: 'postcode',
                        type: 'text',
                        label: 'Postcode',
                        admin: {
                            width: '33.33%'
                        }
                    },
                    {
                        name: 'country',
                        type: 'select',
                        options: countryOptions,
                        defaultValue: 'AU',
                        admin: {
                            width: '33.33%'
                        }
                    }
                ]
            }
        ],
        admin: {
            hideGutter: true
        }
    };
    return deepMerge(generatedAddress, overrides);
};

//# sourceMappingURL=addressFields.js.map