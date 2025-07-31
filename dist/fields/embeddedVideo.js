/**
 * Creates a group field for embedded video configuration
 * Supports Vimeo, YouTube, and internal video hosting
 * @param props - Configuration including media collection slug and field overrides
 * @returns A configured group field for video embedding
 */ export const embeddedVideo = (props)=>{
    const { overrides = {}, mediaCollectionSlug = 'media' } = props || {};
    const field = {
        name: 'embeddedVideo',
        label: 'Embedded Video',
        type: 'group',
        interfaceName: 'EmbeddedVideo',
        admin: {
            hideGutter: true
        },
        fields: [
            {
                name: 'embed',
                type: 'checkbox',
                admin: {
                    description: 'Embeds a Vimeo iframe.'
                }
            },
            {
                name: 'poster',
                label: 'Poster Image',
                type: 'upload',
                relationTo: mediaCollectionSlug,
                admin: {
                    condition: (data, { embed })=>Boolean(embed),
                    description: 'Maximum upload file size: 4MB. Recommended file size for images is <500KB.'
                },
                localized: true
            },
            {
                name: 'platform',
                type: 'select',
                defaultValue: 'vimeo',
                options: [
                    {
                        label: 'Vimeo',
                        value: 'vimeo'
                    },
                    {
                        label: 'Internal',
                        value: 'internal'
                    },
                    {
                        label: 'Youtube',
                        value: 'youtube'
                    }
                ],
                admin: {
                    condition: (data, { embed })=>Boolean(embed)
                }
            },
            {
                name: 'videoURL',
                label: 'Video URL',
                type: 'text',
                required: true,
                admin: {
                    condition: (data, { embed, platform })=>Boolean(embed) && Boolean(platform !== 'internal')
                },
                localized: true
            }
        ],
        ...overrides
    };
    return field;
};

//# sourceMappingURL=embeddedVideo.js.map