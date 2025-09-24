/**
 * Creates an array field for certificates with certificate and completed date
 * @param props - Configuration overrides for the field
 * @returns A configured array field for certificates
 */ export const certificatesField = ({ overrides, certificatesCollectionSlug })=>{
    const field = {
        name: 'certificates',
        type: 'array',
        fields: [
            {
                name: 'certificate',
                type: 'relationship',
                relationTo: certificatesCollectionSlug || 'certificates',
                required: true,
                admin: {
                    allowCreate: false
                }
            },
            {
                name: 'completedDate',
                type: 'date',
                required: true,
                admin: {
                    description: 'The date when the certificate was completed'
                }
            }
        ],
        ...overrides,
        admin: {
            ...overrides?.admin
        }
    };
    return field;
};

//# sourceMappingURL=certifcatesField.js.map