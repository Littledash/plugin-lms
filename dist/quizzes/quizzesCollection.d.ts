import { CollectionConfig } from 'payload';
import { FieldsOverride } from '../types.js';
/**
 * Props interface for configuring the quizzes collection
 * @property mediaCollectionSlug - Slug for the media collection (default: 'media')
 * @property overrides - Optional configuration overrides for fields and collection settings
 */
type Props = {
    mediaCollectionSlug?: string;
    studentsCollectionSlug?: string;
    overrides?: {
        fields?: FieldsOverride;
    } & Partial<Omit<CollectionConfig, 'fields'>>;
};
/**
 * Creates a quizzes collection configuration for Payload CMS
 * This collection manages quizzes and assessments
 *
 * @param props - Configuration properties for the quizzes collection
 * @returns CollectionConfig object for quizzes
 */
export declare const quizzesCollection: (props?: Props) => CollectionConfig<'quizzes'>;
export {};
