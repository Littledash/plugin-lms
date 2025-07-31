// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */ export function isObject(item) {
    return typeof item === 'object' && !Array.isArray(item);
}
/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */ export function deepMerge(target, source) {
    const output = {
        ...target
    };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach((key)=>{
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, {
                        [key]: source[key]
                    });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, {
                    [key]: source[key]
                });
            }
        });
    }
    return output;
}
/**
 * Merges two arrays of fields, intelligently combining field configurations
 * @param existingFields - The existing fields array
 * @param newFields - The new fields to merge
 * @returns Merged fields array with field configurations properly merged
 */ export const mergeFields = (existingFields, newFields)=>{
    const mergedFields = [
        ...existingFields
    ];
    for (const newField of newFields){
        if (!('name' in newField)) {
            // Field without a name, just add it
            mergedFields.push(newField);
            continue;
        }
        // Check if a field with the same name already exists
        const existingFieldIndex = mergedFields.findIndex((field)=>'name' in field && field.name === newField.name);
        if (existingFieldIndex === -1) {
            // Field doesn't exist, add it
            mergedFields.push(newField);
        } else {
            // Field exists, merge the configurations
            const existingField = mergedFields[existingFieldIndex];
            const mergedField = mergeFieldConfigurations(existingField, newField);
            mergedFields[existingFieldIndex] = mergedField;
        }
    }
    return mergedFields;
};
/**
 * Merges two field configurations, combining their properties intelligently
 * @param existingField - The existing field configuration
 * @param newField - The new field configuration to merge
 * @returns Merged field configuration
 */ const mergeFieldConfigurations = (existingField, newField)=>{
    // Start with the existing field as base
    const mergedField = {
        ...existingField
    };
    // Merge basic properties, with new field taking precedence for most properties
    Object.assign(mergedField, newField);
    // Special handling for arrays and objects that should be merged, not replaced
    if (existingField.options && newField.options) {
        // For select fields, merge options arrays
        if (Array.isArray(existingField.options) && Array.isArray(newField.options)) {
            const existingOptions = existingField.options;
            const newOptions = newField.options;
            // Create a map of existing options by value to avoid duplicates
            const optionsMap = new Map();
            existingOptions.forEach((option)=>{
                if (option.value) {
                    optionsMap.set(option.value, option);
                }
            });
            // Add new options, allowing them to override existing ones
            newOptions.forEach((option)=>{
                if (option.value) {
                    optionsMap.set(option.value, option);
                }
            });
            mergedField.options = Array.from(optionsMap.values());
        }
    }
    // Merge admin configurations
    if (existingField.admin && newField.admin) {
        mergedField.admin = {
            ...existingField.admin,
            ...newField.admin
        };
    }
    // Merge validation configurations
    if (existingField.validate && newField.validate) {
        // For validation functions, use the new one as it's more specific
        mergedField.validate = newField.validate;
    }
    // Merge hooks configurations
    if (existingField.hooks && newField.hooks) {
        mergedField.hooks = {
            ...existingField.hooks,
            ...newField.hooks,
            // For arrays like beforeChange, afterRead, etc., concatenate them
            beforeChange: [
                ...existingField.hooks.beforeChange || [],
                ...newField.hooks.beforeChange || []
            ],
            afterChange: [
                ...existingField.hooks.afterChange || [],
                ...newField.hooks.afterChange || []
            ],
            beforeRead: [
                ...existingField.hooks.beforeRead || [],
                ...newField.hooks.beforeRead || []
            ],
            afterRead: [
                ...existingField.hooks.afterRead || [],
                ...newField.hooks.afterRead || []
            ],
            beforeValidate: [
                ...existingField.hooks.beforeValidate || [],
                ...newField.hooks.beforeValidate || []
            ],
            afterValidate: [
                ...existingField.hooks.afterValidate || [],
                ...newField.hooks.afterValidate || []
            ]
        };
    }
    return mergedField;
};

//# sourceMappingURL=deepMerge.js.map