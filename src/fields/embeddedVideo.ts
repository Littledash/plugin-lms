import type {  GroupField } from 'payload'


type Props = {
mediaCollectionSlug: string
  overrides?: Partial<GroupField>
}

export const embeddedVideo: (props?: Props) => GroupField = (props) => {
  const { overrides = {}, mediaCollectionSlug = 'media' } = props || {}

  const field: GroupField = {
    name: 'embeddedVideo',
    label: 'Embedded Video',
    type: 'group',
    interfaceName: 'EmbeddedVideo',
    admin: {
      hideGutter: true,
    },
    fields: [
      {
        name: 'embed',
        type: 'checkbox',
        admin: {
          description: 'Embeds a Vimeo iframe.',
        },
      },
      {
        name: 'poster',
        label: 'Poster Image',
        type: 'upload',
        relationTo: mediaCollectionSlug,
        required: true,
        admin: {
          condition: (data, { embed }) => Boolean(embed),
          description: 'Maximum upload file size: 4MB. Recommended file size for images is <500KB.',
        },
        localized: true,
      },
      {
        name: 'platform',
        type: 'select',
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
        admin: {
          condition: (data, { embed }) => Boolean(embed),
        },
      },
      {
        name: 'videoURL',
        label: 'Video URL',
        type: 'text',
        required: true,
        admin: {
          condition: (data, { embed, platform }) =>
            Boolean(embed) && Boolean(platform !== 'internal'),
        },
        localized: true,
      },
    ],
    ...overrides
  }

  return field 
}
