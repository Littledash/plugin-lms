import { embeddedVideo } from '../fields/embeddedVideo.js';
import { isAdminOrAuthorOrEnrolledInCourseFieldLevel } from '../access/isAdminOrAuthorOrEnrolledInCourse.js';
import { videoProgression } from '../fields/videoProgression.js';
/**
 * Creates a topics collection configuration for Payload CMS
 * This collection manages individual topics within lessons, including content, media, and assessments
 *
 * @param props - Configuration properties for the topics collection
 * @returns CollectionConfig object for topics
 */ export const topicsCollection = (props)=>{
    const { overrides, mediaCollectionSlug = 'media', coursesCollectionSlug = 'courses', quizzesCollectionSlug = 'quizzes', lessonsCollectionSlug = 'lessons' } = props || {};
    const fieldsOverride = overrides?.fields;
    /**
   * Default fields for the topics collection
   * Includes topic content, media, video progression, and assessment relationships
   */ const defaultFields = [
        {
            name: 'title',
            type: 'text',
            required: true,
            admin: {
                description: 'The title of the topic'
            }
        },
        {
            name: 'excerpt',
            type: 'text',
            admin: {
                description: 'The excerpt of the topic'
            }
        },
        {
            name: 'content',
            type: 'richText',
            label: 'Topic Content',
            admin: {
                description: 'The content of the topic'
            },
            access: {
                read: isAdminOrAuthorOrEnrolledInCourseFieldLevel
            }
        },
        {
            name: 'featuredImage',
            type: 'upload',
            relationTo: mediaCollectionSlug,
            admin: {
                position: 'sidebar',
                description: 'The featured image of the topic'
            }
        },
        embeddedVideo({
            mediaCollectionSlug,
            overrides: {
                name: 'topicVideo',
                access: {
                    read: isAdminOrAuthorOrEnrolledInCourseFieldLevel
                },
                admin: {
                    description: 'The video content for this topic'
                }
            }
        }),
        videoProgression({
            overrides: {
                admin: {
                    condition: (data, { topicVideo })=>Boolean(topicVideo.embed)
                },
                access: {
                    read: isAdminOrAuthorOrEnrolledInCourseFieldLevel
                }
            }
        }),
        {
            name: 'topicMaterials',
            type: 'richText',
            label: 'Topic Materials',
            admin: {
                description: 'Additional materials and resources for the topic'
            },
            access: {
                read: isAdminOrAuthorOrEnrolledInCourseFieldLevel
            }
        },
        {
            name: 'course',
            type: 'relationship',
            relationTo: coursesCollectionSlug,
            admin: {
                position: 'sidebar',
                allowCreate: false,
                description: 'The course that the topic is associated with'
            }
        },
        {
            name: 'lesson',
            type: 'relationship',
            relationTo: lessonsCollectionSlug,
            admin: {
                position: 'sidebar',
                allowCreate: false,
                description: 'The lesson that the topic is associated with'
            }
        }
    ];
    // Apply field overrides if provided
    const fields = fieldsOverride && typeof fieldsOverride === 'function' ? fieldsOverride({
        defaultFields
    }) : defaultFields;
    /**
   * Base configuration for the topics collection
   * Includes slug, access control, timestamps, and admin settings
   */ const baseConfig = {
        slug: 'topics',
        timestamps: true,
        ...overrides,
        admin: {
            useAsTitle: 'title',
            group: 'LMS',
            ...overrides?.admin
        },
        fields
    };
    return {
        ...baseConfig
    };
};

//# sourceMappingURL=topicsCollection.js.map