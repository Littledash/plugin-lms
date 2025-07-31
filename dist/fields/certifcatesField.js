/**
 * Creates a relationship field for certificates
 * @param props - Configuration overrides for the field
 * @returns A configured relationship field for certificates
 */ export const certificatesField = ({ overrides, certificatesCollectionSlug, studentsCollectionSlug })=>{
    const field = {
        name: 'certificates',
        type: 'join',
        collection: certificatesCollectionSlug || 'certificates',
        on: studentsCollectionSlug || 'students',
        ...overrides,
        admin: {
            allowCreate: false,
            ...overrides?.admin
        }
    };
    return field;
};

//# sourceMappingURL=certifcatesField.js.map