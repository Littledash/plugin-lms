import { slugField } from '../fields/slug.js';
/**
 * Creates a categories collection configuration for Payload CMS
 * This collection manages course categories for organizing and filtering courses
 *
 * @param props - Configuration properties for the categories collection
 * @returns CollectionConfig object for categories
 */ export const categoriesCollection = (props)=>{
    const { overrides } = props || {};
    const fieldsOverride = overrides?.fields;
    /**
   * Default fields for the categories collection
   * Includes title and slug fields for category identification and URL generation
   */ const defaultFields = [
        {
            name: 'title',
            type: 'text',
            required: true,
            admin: {
                description: 'The title of the category'
            }
        },
        ...slugField()
    ];
    // Apply field overrides if provided
    const fields = fieldsOverride && typeof fieldsOverride === 'function' ? fieldsOverride({
        defaultFields
    }) : defaultFields;
    /**
   * Base configuration for the categories collection
   * Includes slug, access control, timestamps, and admin settings
   */ const baseConfig = {
        slug: 'categories',
        timestamps: true,
        ...overrides,
        admin: {
            useAsTitle: 'title',
            group: 'Taxonomy',
            ...overrides?.admin
        },
        fields
    };
    return {
        ...baseConfig
    };
};

//# sourceMappingURL=categoriesCollection.js.map