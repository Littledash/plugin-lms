import type { TextField, CheckboxField } from 'payload'
/**
 * Overrides for slug and checkbox fields
 */
type Overrides = {
  slugOverrides?: Partial<TextField>
  checkboxOverrides?: Partial<CheckboxField>
}
/**
 * Type definition for the slug field function
 */
type Slug = (fieldToUse?: string, overrides?: Overrides) => [TextField, CheckboxField]
/**
 * Creates a slug field with automatic generation from a source field
 * @param fieldToUse - The field name to use as the source for slug generation
 * @param overrides - Configuration overrides for slug and checkbox fields
 * @returns A tuple containing the slug field and its associated checkbox field
 */
export declare const slugField: Slug
export {}
