import { checkRole } from '../access/checkRole.js';
import { defaultAccess, withDefaultAccess } from '../access/defaultAccess.js';
import { isAdminFieldLevel } from '../access/isAdmin.js';
import { toId } from '../services/shared.js';
import { defaultCountries } from './defaultCountries.js';
/**
 * Students can create and edit their own addresses, but the owner is always the logged-in user.
 * Admins may set `customer` to someone else.
 */ const forceAddressCustomer = ({ data, originalDoc, req })=>{
    if (checkRole([
        'admin'
    ], req.user)) {
        return data;
    }
    const ownerId = req.user?.id;
    if (ownerId === undefined) {
        return data;
    }
    return {
        ...data,
        customer: originalDoc ? toId(originalDoc.customer) ?? ownerId : ownerId
    };
};
export const addressesCollection = (props)=>{
    const { addressFields, overrides, studentsCollectionSlug = 'users' } = props || {};
    const fieldsOverride = overrides?.fields;
    const { supportedCountries: supportedCountriesFromProps } = props || {};
    const supportedCountries = supportedCountriesFromProps || defaultCountries;
    const hasOnlyOneCountry = supportedCountries && supportedCountries.length === 1;
    const defaultFields = [
        {
            name: 'customer',
            type: 'relationship',
            access: {
                create: isAdminFieldLevel,
                update: isAdminFieldLevel
            },
            label: 'Student',
            relationTo: studentsCollectionSlug
        },
        ...addressFields.map((field)=>{
            if ('name' in field && field.name === 'country') {
                return {
                    name: 'country',
                    type: 'select',
                    label: 'Country',
                    options: supportedCountries || defaultCountries,
                    required: true,
                    ...supportedCountries && supportedCountries?.[0] && hasOnlyOneCountry ? {
                        defaultValue: supportedCountries?.[0].value
                    } : {}
                };
            }
            return field;
        })
    ];
    const fields = fieldsOverride && typeof fieldsOverride === 'function' ? fieldsOverride({
        defaultFields
    }) : defaultFields;
    const baseConfig = {
        slug: 'addresses',
        timestamps: true,
        ...overrides,
        access: withDefaultAccess(defaultAccess.addresses, overrides?.access),
        admin: {
            useAsTitle: 'createdAt',
            ...overrides?.admin
        },
        fields,
        hooks: {
            ...overrides?.hooks,
            beforeChange: [
                forceAddressCustomer,
                ...overrides?.hooks?.beforeChange || []
            ]
        }
    };
    return {
        ...baseConfig
    };
};

//# sourceMappingURL=addressesCollection.js.map