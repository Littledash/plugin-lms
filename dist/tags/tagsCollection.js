import { slugField } from '../fields/slug.js';
export const tagsCollection = (props)=>{
    const { overrides } = props || {};
    const fieldsOverride = overrides?.fields;
    const defaultFields = [
        {
            name: 'title',
            type: 'text',
            required: true,
            admin: {
                description: 'The title of the tag'
            }
        },
        ...slugField()
    ];
    const fields = fieldsOverride && typeof fieldsOverride === 'function' ? fieldsOverride({
        defaultFields
    }) : defaultFields;
    const baseConfig = {
        slug: 'tags',
        access: {
            // TODO: Add access control
            read: ()=>true
        },
        timestamps: true,
        ...overrides,
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

//# sourceMappingURL=tagsCollection.js.map