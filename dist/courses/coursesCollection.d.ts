import type { CollectionConfig } from 'payload';
import type { CurrenciesConfig, FieldsOverride } from '../types.js';
/**
 * Props interface for configuring the courses collection
 * @property categoriesCollectionSlug - Slug for the categories collection (default: 'categories')
 * @property certificatesCollectionSlug - Slug for the certificates collection (default: 'certificates')
 * @property currenciesConfig - Configuration for supported currencies
 * @property lessonsCollectionSlug - Slug for the lessons collection (default: 'lessons')
 * @property mediaCollectionSlug - Slug for the media collection (default: 'media')
 * @property studentsCollectionSlug - Slug for the students collection (default: 'users')
 * @property tagsCollectionSlug - Slug for the tags collection (default: 'tags')
 * @property overrides - Optional configuration overrides for fields and collection settings
 */
type Props = {
    categoriesCollectionSlug?: string;
    certificatesCollectionSlug?: string;
    currenciesConfig?: CurrenciesConfig;
    lessonsCollectionSlug?: string;
    mediaCollectionSlug?: string;
    overrides?: {
        fields?: FieldsOverride;
    } & Partial<Omit<CollectionConfig, 'fields'>>;
    studentsCollectionSlug?: string;
    tagsCollectionSlug?: string;
};
/**
 * Creates a courses collection configuration for Payload CMS
 * This collection manages educational courses with various access modes, pricing, and content organization
 *
 * @param props - Configuration properties for the courses collection
 * @returns CollectionConfig object for courses
 */
export declare const coursesCollection: (props?: Props) => CollectionConfig<'courses'>;
export {};
