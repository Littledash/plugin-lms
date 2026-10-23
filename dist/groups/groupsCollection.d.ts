import type { CollectionConfig } from 'payload';
import type { FieldsOverride } from '../types.js';
type Props = {
    couponsCollectionSlug?: string;
    coursesCollectionSlug?: string;
    overrides?: {
        fields?: FieldsOverride;
    } & Partial<Omit<CollectionConfig, 'fields'>>;
    usersCollectionSlug?: string;
};
export declare const groupsCollection: (props?: Props) => CollectionConfig;
export {};
