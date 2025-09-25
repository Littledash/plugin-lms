import { CollectionConfig } from 'payload';
import { FieldsOverride } from '../types.js';
type Props = {
    usersCollectionSlug?: string;
    overrides?: {
        fields?: FieldsOverride;
    } & Partial<Omit<CollectionConfig, 'fields'>>;
};
export declare const groupsCollection: (props?: Props) => CollectionConfig;
export {};
