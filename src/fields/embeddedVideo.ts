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
export const embeddedVideo: (props?: Props) => GroupField = (props) => {
  const { mediaCollectionSlug = 'media', overrides = {} } = props || {}

  const field: GroupField = {
    name: 'embeddedVideo',
    type: 'group',
    admin: {
      hideGutter: true,
    },
    fields: [
      {
        name: 'embed',
        type: 'checkbox',
        admin: {
          description: 'Show a video on this page.',
        },
      },
      {
        name: 'poster',
        type: 'upload',
        admin: {
          condition: (data, { embed }) => Boolean(embed),
          description: 'Maximum upload file size: 4MB. Recommended file size for images is <500KB.',
        },
        label: 'Poster Image',
        localized: true,
        relationTo: mediaCollectionSlug,
      },
      {
        name: 'platform',
        type: 'select',
        admin: {
          condition: (data, { embed }) => Boolean(embed),
          description:
            'Where the video is hosted. Vimeo and YouTube need the video URL; Internal videos are supplied by the site and need no URL.',
        },
        defaultValue: 'vimeo',
        options: [
          {
            label: 'Vimeo',
            value: 'vimeo',
          },
          {
            label: 'Internal',
            value: 'internal',
          },
          {
            label: 'Youtube',
            value: 'youtube',
          },
        ],
      },
      {
        name: 'videoURL',
        type: 'text',
        admin: {
          condition: (data, { embed, platform }) =>
            Boolean(embed) && Boolean(platform !== 'internal'),
          description: 'The link to the video page, such as https://vimeo.com/123456789.',
        },
        label: 'Video URL',
        localized: true,
        required: true,
      },
    ],
    interfaceName: 'EmbeddedVideo',
    label: 'Embedded Video',
    ...overrides,
  }

  return field
}
