import { CollectionConfig } from 'payload'
import { FieldsOverride } from '../types.js'
type Props = {
  overrides?: {
    fields?: FieldsOverride
  } & Partial<Omit<CollectionConfig, 'fields'>>
}
export declare const tagsCollection: (props?: Props) => CollectionConfig<'tags'>
export {}
