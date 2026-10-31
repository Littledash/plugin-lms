import type { CollectionConfig } from 'payload';
import type { FieldsOverride } from '../types.js';
type Props = {
    overrides?: {
        fields?: FieldsOverride;
    } & Partial<Omit<CollectionConfig, 'fields'>>;
    studentsCollectionSlug?: string;
};
/**
 * Accepted file types, checked against the file's contents rather than its name.
 *
 * Images are listed one by one instead of `image/*` so SVG is excluded: anyone logged in can upload
 * here, and an SVG can carry script that runs when staff open the file. Word is `.docx` only:
 * older `.doc` files are detected as a generic Office container that also covers spreadsheets,
 * presentations and macro-carrying files.
 */
export declare const DEFAULT_DOCUMENT_MIME_TYPES: string[];
/**
 * Private uploads, such as generated certificates and files sent through site forms. Unlike a
 * public media collection, each document is readable only by its owner and admins and authors,
 * and downloads go through the same check.
 */
export declare const documentsCollection: (props?: Props) => CollectionConfig;
export {};
