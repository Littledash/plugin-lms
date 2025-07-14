import { isAdminOrAuthor } from '../access/isAdminOrAuthor.js';
import { isAdminOrAuthorOrStudent } from '../access/isAdminOrAuthorOrStudent.js';
/**
 * Creates a certificates collection configuration for Payload CMS
 * This collection manages digital certificates for course completion
 *
 * @param props - Configuration properties for the certificates collection
 * @returns CollectionConfig object for certificates
 */ export const certificatesCollection = (props)=>{
    const { overrides, coursesCollectionSlug = 'courses', studentsCollectionSlug = 'users', mediaCollectionSlug = 'media' } = props || {};
    const fieldsOverride = overrides?.fields;
    /**
   * Default fields for the certificates collection
   * Includes title, description, template, course relationship, student relationships,
   * issue date, expiry date, certificate number, and status
   */ const defaultFields = [
        {
            name: 'title',
            type: 'text',
            required: true,
            admin: {
                description: 'The title of the certificate'
            }
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
            relationTo: mediaCollectionSlug,
            required: true,
            admin: {
                description: 'The certificate template image'
            }
        },
        {
            name: 'course',
            type: 'relationship',
            relationTo: coursesCollectionSlug,
            required: true,
            admin: {
                description: 'The course this certificate is for'
            }
        },
        {
            name: 'students',
            type: 'relationship',
            relationTo: studentsCollectionSlug,
            required: true,
            hasMany: true,
            admin: {
                description: 'The students who earned this certificate'
            }
        },
        {
            name: 'issueDate',
            type: 'date',
            required: true,
            admin: {
                description: 'The date the certificate was issued'
            }
        },
        {
            name: 'expiryDate',
            type: 'date',
            admin: {
                description: 'The date the certificate expires (if applicable)'
            }
        },
        {
            name: 'certificateNumber',
            type: 'text',
            required: true,
            unique: true,
            admin: {
                description: 'The unique certificate number'
            }
        },
        {
            name: 'status',
            type: 'select',
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
            required: true,
            admin: {
                description: 'The status of the certificate'
            }
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
        access: {
            read: isAdminOrAuthorOrStudent,
            create: isAdminOrAuthor,
            update: isAdminOrAuthor,
            delete: isAdminOrAuthor
        },
        timestamps: true,
        ...overrides,
        admin: {
            useAsTitle: 'title',
            group: 'LMS',
            ...overrides?.admin
        },
        fields
    };
    return {
        ...baseConfig
    };
};

//# sourceMappingURL=certificatesCollection.js.map