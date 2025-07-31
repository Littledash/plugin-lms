import type { GroupField } from 'payload'
/**
 * Props for the embedded video field configuration
 */
type Props = {
  mediaCollectionSlug: string
  overrides?: Partial<GroupField>
}
/**
 * Creates a group field for embedded video configuration
 * Supports Vimeo, YouTube, and internal video hosting
 * @param props - Configuration including media collection slug and field overrides
 * @returns A configured group field for video embedding
 */
export declare const embeddedVideo: (props?: Props) => GroupField
export {}
