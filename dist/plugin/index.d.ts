import type { Config } from 'payload'
import type { LMSPluginConfig } from '../types.js'
/**
 *
 *@TODO add groups collection and fields
  - fields
  name
  description
  members (relationship)
  createdBy (relationship)
  updatedBy (relationship)
  createdAt
  updatedAt

  @TODO - than add groups to courses collection as a relationship
 */
export declare const lmsPlugin: (
  pluginConfig?: LMSPluginConfig,
) => (incomingConfig: Config) => Config
