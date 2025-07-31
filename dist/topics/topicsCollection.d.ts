import { CollectionConfig } from 'payload'
import { FieldsOverride } from '../types.js'
/**
 * Props interface for configuring the topics collection
 * @property coursesCollectionSlug - Slug for the courses collection (default: 'courses')
 * @property mediaCollectionSlug - Slug for the media collection (default: 'media')
 * @property quizzesCollectionSlug - Slug for the quizzes collection (default: 'quizzes')
 * @property lessonsCollectionSlug - Slug for the lessons collection (default: 'lessons')
 * @property overrides - Optional configuration overrides for fields and collection settings
 */
type Props = {
  coursesCollectionSlug?: string
  mediaCollectionSlug?: string
  quizzesCollectionSlug?: string
  lessonsCollectionSlug?: string
  overrides?: {
    fields?: FieldsOverride
  } & Partial<Omit<CollectionConfig, 'fields'>>
}
/**
 * Creates a topics collection configuration for Payload CMS
 * This collection manages individual topics within lessons, including content, media, and assessments
 *
 * @param props - Configuration properties for the topics collection
 * @returns CollectionConfig object for topics
 */
export declare const topicsCollection: (props?: Props) => CollectionConfig<'topics'>
export {}
