import { formatSlugHook } from '../ui/SlugInput/formatSlug.js';
/**
 * Creates a slug field with automatic generation from a source field
 * @param fieldToUse - The field name to use as the source for slug generation
 * @param overrides - Configuration overrides for slug and checkbox fields
 * @returns A tuple containing the slug field and its associated checkbox field
 */ export const slugField = (fieldToUse = 'title', overrides = {})=>{
    const { checkboxOverrides, slugOverrides } = overrides;
    const checkBoxField = {
        name: 'slugLock',
        type: 'checkbox',
        admin: {
            hidden: true,
            position: 'sidebar'
        },
        defaultValue: true,
        ...checkboxOverrides
    };
    // @ts-expect-error - ts mismatch Partial<TextField> with TextField
    const slugField = {
        name: 'slug',
        type: 'text',
        index: true,
        label: 'Slug',
        ...slugOverrides || {},
        admin: {
            position: 'sidebar',
            ...slugOverrides?.admin || {},
            components: {
                Field: {
                    clientProps: {
                        checkboxFieldPath: checkBoxField.name,
                        fieldToUse
                    },
                    path: '@littledash/plugin-lms/ui/SlugInput#SlugInput'
                }
            }
        },
        hooks: {
            // Kept this in for hook or API based updates
            beforeValidate: [
                formatSlugHook(fieldToUse)
            ]
        }
    };
    return [
        slugField,
        checkBoxField
    ];
};

//# sourceMappingURL=slug.js.map