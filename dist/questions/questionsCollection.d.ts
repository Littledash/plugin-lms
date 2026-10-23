import type { CollectionConfig } from 'payload';
import type { FieldsOverride, QuestionTypeOption } from '../types.js';
/**
 * Props interface for configuring the questions collection
 * @property overrides - Optional configuration overrides for fields and collection settings
 * @property questionTypes - Optional array of question type options to override defaults
 */
type Props = {
    overrides?: {
        fields?: FieldsOverride;
    } & Partial<Omit<CollectionConfig, 'fields'>>;
    questionTypes?: QuestionTypeOption[];
    studentsCollectionSlug?: string;
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
