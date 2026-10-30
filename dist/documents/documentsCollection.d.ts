import type { CollectionConfig } from 'payload';
import type { FieldsOverride } from '../types.js';
type Props = {
    overrides?: {
        fields?: FieldsOverride;
    } & Partial<Omit<CollectionConfig, 'fields'>>;
    studentsCollectionSlug?: string;
};
/**
 * Private uploads, such as generated certificates and files sent through site forms. Unlike a
 * public media collection, each document is readable only by its owner and admins and authors,
 * and downloads go through the same check.
 */
export declare const documentsCollection: (props?: Props) => CollectionConfig;
export {};
