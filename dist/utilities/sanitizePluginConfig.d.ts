import type { LMSPluginConfig, SanitizedLMSPluginConfig } from '../types.js';
type Props = {
    pluginConfig: LMSPluginConfig;
};
export declare const sanitizePluginConfig: ({ pluginConfig }: Props) => SanitizedLMSPluginConfig;
export {};
