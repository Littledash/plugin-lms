import type { CollectionSlugMap, SanitizedLMSPluginConfig } from '../types.js';
export declare const defaultCollectionSlugMap: CollectionSlugMap;
type Props = {
    sanitizedPluginConfig: SanitizedLMSPluginConfig;
};
/**
 * Generates a map of collection slugs based on the sanitized plugin configuration.
 * Takes into consideration any collection overrides provided in the plugin.
 */
export declare const getCollectionSlugMap: ({ sanitizedPluginConfig }: Props) => CollectionSlugMap;
export {};
