import type { CollectionSlugMap, SanitizedLMSPluginConfig } from '../types.js';
type Props = {
    sanitizedPluginConfig: SanitizedLMSPluginConfig;
};
/**
 * Generates a map of collection slugs based on the sanitized plugin configuration.
 * Takes into consideration any collection overrides provided in the plugin.
 */
export declare const getCollectionSlugMap: ({ sanitizedPluginConfig }: Props) => CollectionSlugMap;
export {};
