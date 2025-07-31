import { CollectionConfig } from 'payload'
import { FieldsOverride } from '../types.js'
/**
 * Props interface for configuring the certificates collection
 * @property coursesCollectionSlug - Slug for the courses collection (default: 'courses')
 * @property studentsCollectionSlug - Slug for the students collection (default: 'users')
 * @property mediaCollectionSlug - Slug for the media collection (default: 'media')
 * @property overrides - Optional configuration overrides for fields and collection settings
 */
type Props = {
  coursesCollectionSlug?: string
  studentsCollectionSlug?: string
  mediaCollectionSlug?: string
  overrides?: {
    fields?: FieldsOverride
  } & Partial<Omit<CollectionConfig, 'fields'>>
}
/**
 * Creates a certificates collection configuration for Payload CMS
 * This collection manages digital certificates for course completion
 *
 * @param props - Configuration properties for the certificates collection
 * @returns CollectionConfig object for certificates
 */
export declare const certificatesCollection: (props?: Props) => CollectionConfig<'certificates'>
export {}
