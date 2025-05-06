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
export const videoProgression: (props?: Props) => GroupField = (props) => {
  const { overrides = {} } = props || {}

  const field: GroupField = {
    name: 'videoProgression',
    type: 'group',
    interfaceName: 'VideoProgression',
    fields: [
      {
        name: 'displayTiming',
        type: 'select',
        required: true,
        defaultValue: 'before',
        options: [
          { label: 'Before completed sub-steps', value: 'before' },
          { label: 'After completed sub-steps', value: 'after' },
        ],
        admin: {
          description:
            'Before completed sub-steps: The video will be shown and must be fully watched before the user can access the lesson\’s associated steps | After completed sub-steps:  The video will be visible after the user has completed the lesson’\s associated steps. The full video must be watched in order to complete the lesson.',
        },
      },
      {
        name: 'autoStart',
        type: 'checkbox',
        defaultValue: true,
        admin: {
          description: 'If checked, the video will start automatically when the lesson is opened',
        },
      },
      {
        name: 'videoControls',
        type: 'checkbox',
        defaultValue: true,
        admin: {
          description: 'If checked, the video will have controls',
        },
      },
    ],
    admin: {
      hideGutter: true,
    },
    ...overrides,
  }

  return field
}
