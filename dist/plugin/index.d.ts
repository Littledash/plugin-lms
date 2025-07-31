import type { Config } from 'payload';
import type { LMSPluginConfig } from '../types.js';
export declare const lmsPlugin: (pluginConfig?: LMSPluginConfig) => (incomingConfig: Config) => Config;
