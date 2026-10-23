import type { CollectionConfig, Field } from 'payload';
import type { FieldsOverride } from '../types.js';
/**
 * Props interface for configuring the courses collection
 * @property studentsCollectionSlug - Slug for the students collection (default: 'users')
 * @property certificatesCollectionSlug - Slug for the certificates collection (default: 'certificates')
 * @property overrides - Optional configuration overrides for fields and collection settings
 */
type Props = {
    certificatesCollectionSlug?: string;
    overrides?: {
        fields?: FieldsOverride;
    } & Partial<Omit<CollectionConfig, 'fields'>>;
    studentsCollectionSlug?: string;
    /**
     * Array of fields used for capturing the students data. Use this over overrides to customise the fields here as it's reused across the plugin.
     */
    studentsFields: Field[];
};
/**
 * Creates a courses collection configuration for Payload CMS
 * This collection manages educational courses with various access modes, pricing, and content organization
 *
 * @param props - Configuration properties for the courses collection
 * @returns CollectionConfig object for courses
 */
export declare const studentsCollection: (props?: Props) => CollectionConfig;
export {};
