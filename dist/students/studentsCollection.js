import { mergeFields } from '../utilities/deepMerge.js';
/**
 * Creates a courses collection configuration for Payload CMS
 * This collection manages educational courses with various access modes, pricing, and content organization
 *
 * @param props - Configuration properties for the courses collection
 * @returns CollectionConfig object for courses
 */ export const studentsCollection = (props)=>{
    const { overrides, studentsFields = [], studentsCollectionSlug = 'users' } = props || {};
    const fieldsOverride = overrides?.fields;
    /**
   * Default fields for the courses collection
   * Includes course details, access control, pricing, relationships, and content organization
   */ const defaultFields = [
        ...studentsFields
    ];
    // Apply field overrides if provided
    let fields;
    if (fieldsOverride && typeof fieldsOverride === 'function') {
        // Get the user's fields
        const userFields = fieldsOverride({
            defaultFields
        });
        // Merge user fields with default fields, avoiding duplicates
        fields = mergeFields(defaultFields, userFields);
    } else {
        fields = defaultFields;
    }
    /**
   * Base configuration for the courses collection
   * Includes slug, access control, timestamps, and admin settings
   */ const baseConfig = {
        slug: studentsCollectionSlug,
        timestamps: true,
        ...overrides,
        admin: {
            ...overrides?.admin
        },
        fields
    };
    return {
        ...baseConfig
    };
};

//# sourceMappingURL=studentsCollection.js.map