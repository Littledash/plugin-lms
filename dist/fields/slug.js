import { formatSlugHook } from '../ui/SlugInput/formatSlug.js';
/**
 * Creates a slug field with automatic generation from a source field
 * @param fieldToUse - The field name to use as the source for slug generation
 * @param overrides - Configuration overrides for slug and checkbox fields
 * @returns A tuple containing the slug field and its associated checkbox field
 */ export const slugField = (fieldToUse = 'title', overrides = {})=>{
    const { slugOverrides, checkboxOverrides } = overrides;
    const checkBoxField = {
        name: 'slugLock',
        type: 'checkbox',
        defaultValue: true,
        admin: {
            hidden: true,
            position: 'sidebar'
        },
        ...checkboxOverrides
    };
    // @ts-expect-error - ts mismatch Partial<TextField> with TextField
    const slugField = {
        name: 'slug',
        type: 'text',
        index: true,
        label: 'Slug',
        ...slugOverrides || {},
        hooks: {
            // Kept this in for hook or API based updates
            beforeValidate: [
                formatSlugHook(fieldToUse)
            ]
        },
        admin: {
            position: 'sidebar',
            ...slugOverrides?.admin || {},
            components: {
                Field: {
                    path: '@littledash/plugin-lms/ui/SlugInput#SlugInput',
                    clientProps: {
                        fieldToUse,
                        checkboxFieldPath: checkBoxField.name
                    }
                }
            }
        }
    };
    return [
        slugField,
        checkBoxField
    ];
};

//# sourceMappingURL=slug.js.map