import type { GroupField } from 'payload'
/**
 * Props for the video progression field configuration
 */
type Props = {
  overrides?: Partial<GroupField>
}
/**
 * Creates a group field for video progression configuration
 * @param props - Configuration including field overrides
 * @returns A configured group field for video progression
 */
export declare const videoProgression: (props?: Props) => GroupField
export {}
