import type { CollectionConfig } from 'payload';
import type { FieldsOverride } from '../types.js';
/**
 * Props interface for configuring the lessons collection
 * @property coursesCollectionSlug - Slug for the courses collection (default: 'courses')
 * @property mediaCollectionSlug - Slug for the media collection (default: 'media')
 * @property quizzesCollectionSlug - Slug for the quizzes collection (default: 'quizzes')
 * @property overrides - Optional configuration overrides for fields and collection settings
 */
type Props = {
    categoriesCollectionSlug?: string;
    coursesCollectionSlug?: string;
    mediaCollectionSlug?: string;
    overrides?: {
        fields?: FieldsOverride;
    } & Partial<Omit<CollectionConfig, 'fields'>>;
    quizzesCollectionSlug?: string;
    studentsCollectionSlug?: string;
};
/**
 * Creates a lessons collection configuration for Payload CMS
 * This collection manages individual lessons within courses, including content, media, and assessments
 *
 * @param props - Configuration properties for the lessons collection
 * @returns CollectionConfig object for lessons
 */
export declare const lessonsCollection: (props?: Props) => CollectionConfig<'lessons'>;
export {};
