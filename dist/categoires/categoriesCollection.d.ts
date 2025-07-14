import { CollectionConfig } from 'payload';
import { FieldsOverride } from '../types.js';
/**
 * Props interface for configuring the categories collection
 * @property overrides - Optional configuration overrides for fields and collection settings
 */
type Props = {
    overrides?: {
        fields?: FieldsOverride;
    } & Partial<Omit<CollectionConfig, 'fields'>>;
};
/**
 * Creates a categories collection configuration for Payload CMS
 * This collection manages course categories for organizing and filtering courses
 *
 * @param props - Configuration properties for the categories collection
 * @returns CollectionConfig object for categories
 */
export declare const categoriesCollection: (props?: Props) => CollectionConfig<'categories'>;
export {};
