import { defaultAccess, withDefaultAccess } from '../access/defaultAccess.js';
/**
 * Creates a certificates collection configuration for Payload CMS
 * This collection manages digital certificates for course completion
 *
 * @param props - Configuration properties for the certificates collection
 * @returns CollectionConfig object for certificates
 */ export const certificatesCollection = (props)=>{
    const { coursesCollectionSlug = 'courses', mediaCollectionSlug = 'media', overrides, studentsCollectionSlug = 'users' } = props || {};
    const fieldsOverride = overrides?.fields;
    /**
   * Default fields for the certificates collection
   * Includes title, description, template, course relationship, student relationships,
   * issue date, expiry date, certificate number, and status
   */ const defaultFields = [
        {
            name: 'title',
            type: 'text',
            admin: {
                description: 'The title of the certificate'
            },
            required: true
        },
        {
            name: 'description',
            type: 'richText',
            admin: {
                description: 'The description of the certificate'
            }
        },
        {
            name: 'template',
            type: 'upload',
            admin: {
                description: 'The certificate template image'
            },
            relationTo: mediaCollectionSlug
        },
        {
            name: 'courses',
            type: 'relationship',
            admin: {
                allowCreate: false,
                description: 'The courses this certificate is for'
            },
            hasMany: true,
            relationTo: coursesCollectionSlug
        },
        {
            name: 'expiryDate',
            type: 'date',
            admin: {
                description: 'The date the certificate expires (if applicable)'
            }
        },
        {
            name: 'status',
            type: 'select',
            admin: {
                description: 'The status of the certificate'
            },
            defaultValue: 'active',
            options: [
                {
                    label: 'Active',
                    value: 'active'
                },
                {
                    label: 'Expired',
                    value: 'expired'
                },
                {
                    label: 'Revoked',
                    value: 'revoked'
                }
            ],
            required: true
        },
        {
            name: 'authors',
            type: 'relationship',
            admin: {
                allowCreate: false,
                description: 'The authors of the certificate'
            },
            hasMany: true,
            relationTo: studentsCollectionSlug
        }
    ];
    // Apply field overrides if provided
    const fields = fieldsOverride && typeof fieldsOverride === 'function' ? fieldsOverride({
        defaultFields
    }) : defaultFields;
    /**
   * Base configuration for the certificates collection
   * Includes slug, access control, timestamps, and admin settings
   */ const baseConfig = {
        slug: 'certificates',
        timestamps: true,
        ...overrides,
        access: withDefaultAccess(defaultAccess.certificates, overrides?.access),
        admin: {
            useAsTitle: 'title',
            ...overrides?.admin
        },
        fields
    };
    return {
        ...baseConfig
    };
};

//# sourceMappingURL=certificatesCollection.js.map