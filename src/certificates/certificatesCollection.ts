import { CollectionConfig, Field } from 'payload';
import { FieldsOverride } from '../types.js';

type Props = {
    coursesCollectionSlug?: string
    studentsCollectionSlug?: string
    mediaCollectionSlug?: string
    overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}

export const certificatesCollection: (props?: Props) => CollectionConfig<'certificates'> = (props) => {
    const { overrides, coursesCollectionSlug = 'courses', studentsCollectionSlug = 'users', mediaCollectionSlug = 'media' } = props || {}
    const fieldsOverride = overrides?.fields

    const defaultFields: Field[] = [
        {
            name: 'title',
            type: 'text',
            required: true,
            admin: {
                description: 'The title of the certificate',
            },
        },
        {
            name: 'description',
            type: 'richText',
            admin: {
                description: 'The description of the certificate',
            },
        },
        {
            name: 'template',
            type: 'upload',
            relationTo: mediaCollectionSlug,
            required: true,
            admin: {
                description: 'The certificate template image',
            },
        },
        {
            name: 'course',
            type: 'relationship',
            relationTo: coursesCollectionSlug,
            required: true,
            admin: {
                description: 'The course this certificate is for',
            },
        },
        {
            name: 'students',
            type: 'relationship',
            relationTo: studentsCollectionSlug,
            required: true,
            hasMany: true,
            admin: {
                description: 'The students who earned this certificate',
            },
        },
        {
            name: 'issueDate',
            type: 'date',
            required: true,
            admin: {
                description: 'The date the certificate was issued',
            },
        },
        {
            name: 'expiryDate',
            type: 'date',
            admin: {
                description: 'The date the certificate expires (if applicable)',
            },
        },
        {
            name: 'certificateNumber',
            type: 'text',
            required: true,
            unique: true,
            admin: {
                description: 'The unique certificate number',
            },
        },
        {
            name: 'status',
            type: 'select',
            defaultValue: 'active',
            options: [
                { label: 'Active', value: 'active' },
                { label: 'Expired', value: 'expired' },
                { label: 'Revoked', value: 'revoked' },
            ],
            required: true,
            admin: {
                description: 'The status of the certificate',
            },
        },
    ]

    const fields =
        fieldsOverride && typeof fieldsOverride === 'function'
            ? fieldsOverride({ defaultFields })
            : defaultFields

    const baseConfig: CollectionConfig = {
        slug: 'certificates',
        access: {
            read: () => true,
            create: () => true,
            update: () => true,
            delete: () => true,
        },
        timestamps: true,
        ...overrides,
        admin: {
            useAsTitle: 'title',
            ...overrides?.admin,
        },
        fields,
    }

    return { ...baseConfig }
} 