import type { SelectField } from 'payload';
/**
 * Props for the roles field configuration
 */
type Props = {
    overrides?: Partial<SelectField>;
};
/**
 * Available role options for the select field
 */
export declare const rolesOptions: {
    label: string;
    value: string;
}[];
/**
 * Creates a select field for user roles
 * @param props - Configuration overrides for the field
 * @returns A configured select field for roles
 */
export declare const rolesField: (props: Props) => SelectField;
export {};
