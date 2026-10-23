export const defaultAddressFields = ()=>{
    return [
        {
            type: 'row',
            fields: [
                {
                    name: 'title',
                    type: 'text',
                    admin: {
                        width: '100%'
                    },
                    label: 'Title'
                },
                {
                    name: 'firstName',
                    type: 'text',
                    admin: {
                        width: '50%'
                    },
                    label: 'First name'
                },
                {
                    name: 'lastName',
                    type: 'text',
                    admin: {
                        width: '50%'
                    },
                    label: 'Last name'
                },
                {
                    name: 'company',
                    type: 'text',
                    admin: {
                        width: '100%'
                    },
                    label: 'Company'
                },
                {
                    name: 'addressLine1',
                    type: 'text',
                    admin: {
                        width: '100%'
                    },
                    label: 'Address line 1'
                },
                {
                    name: 'addressLine2',
                    type: 'text',
                    admin: {
                        width: '100%'
                    },
                    label: 'Address line 2'
                },
                {
                    name: 'city',
                    type: 'text',
                    admin: {
                        width: '33.33%'
                    },
                    label: 'City'
                },
                {
                    name: 'state',
                    type: 'text',
                    admin: {
                        width: '33.33%'
                    },
                    label: 'State'
                },
                {
                    name: 'postalCode',
                    type: 'text',
                    admin: {
                        width: '33.33%'
                    },
                    label: 'Postal code'
                },
                {
                    name: 'country',
                    type: 'text',
                    admin: {
                        width: '100%'
                    },
                    label: 'Country'
                },
                {
                    name: 'phone',
                    type: 'text',
                    admin: {
                        width: '100%'
                    },
                    label: 'Phone'
                }
            ]
        }
    ];
};

//# sourceMappingURL=defaultAddressFields.js.map