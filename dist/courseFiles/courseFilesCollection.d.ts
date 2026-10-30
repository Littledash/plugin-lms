import type { CollectionConfig } from 'payload';
import type { FieldsOverride } from '../types.js';
type Props = {
    overrides?: {
        fields?: FieldsOverride;
    } & Partial<Omit<CollectionConfig, 'fields'>>;
};
/**
 * Files that come with paid lessons, such as workbooks and handouts. A file is readable, and
 * downloadable, only by students who can currently open a lesson offering it, and by admins and
 * authors. Public images belong in the media collection instead.
 */
export declare const courseFilesCollection: (props?: Props) => CollectionConfig;
export {};
