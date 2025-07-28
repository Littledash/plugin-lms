import { CollectionConfig } from 'payload';
import { FieldsOverride } from '../types.js';
/**
 * Props interface for configuring the questions collection
 * @property overrides - Optional configuration overrides for fields and collection settings
 */
type Props = {
    studentsCollectionSlug?: string;
    overrides?: {
        fields?: FieldsOverride;
    } & Partial<Omit<CollectionConfig, 'fields'>>;
};
/**
 * Creates a questions collection configuration for Payload CMS
 * This collection manages questions for quizzes and assessments
 *
 * @param props - Configuration properties for the questions collection
 * @returns CollectionConfig object for questions
 */
export declare const questionsCollection: (props?: Props) => CollectionConfig<'questions'>;
export {};
