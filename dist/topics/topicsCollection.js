import { defaultAccess, withDefaultAccess } from '../access/defaultAccess.js';
import { isAdminOrAuthorOrEnrolledInCourseFieldLevel } from '../access/isAdminOrAuthorOrEnrolledInCourse.js';
import { embeddedVideo } from '../fields/embeddedVideo.js';
import { videoProgression } from '../fields/videoProgression.js';
/**
 * Creates a topics collection configuration for Payload CMS
 * This collection manages individual topics within lessons, including content, media, and assessments
 *
 * @param props - Configuration properties for the topics collection
 * @returns CollectionConfig object for topics
 */ export const topicsCollection = (props)=>{
    const { coursesCollectionSlug = 'courses', lessonsCollectionSlug = 'lessons', mediaCollectionSlug = 'media', overrides, quizzesCollectionSlug = 'quizzes' } = props || {};
    const fieldsOverride = overrides?.fields;
    /**
   * Default fields for the topics collection
   * Includes topic content, media, video progression, and assessment relationships
   */ const defaultFields = [
        {
            name: 'title',
            type: 'text',
            admin: {
                description: 'The title of the topic'
            },
            required: true
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
            access: {
                read: isAdminOrAuthorOrEnrolledInCourseFieldLevel
            },
            admin: {
                description: 'The content of the topic'
            },
            label: 'Topic Content'
        },
        {
            name: 'featuredImage',
            type: 'upload',
            admin: {
                description: 'The featured image of the topic',
                position: 'sidebar'
            },
            relationTo: mediaCollectionSlug
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
                access: {
                    read: isAdminOrAuthorOrEnrolledInCourseFieldLevel
                },
                admin: {
                    condition: (data, { topicVideo })=>Boolean(topicVideo.embed)
                }
            }
        }),
        {
            name: 'topicMaterials',
            type: 'richText',
            access: {
                read: isAdminOrAuthorOrEnrolledInCourseFieldLevel
            },
            admin: {
                description: 'Additional materials and resources for the topic'
            },
            label: 'Topic Materials'
        },
        {
            name: 'course',
            type: 'relationship',
            admin: {
                allowCreate: false,
                description: 'The course that the topic is associated with',
                position: 'sidebar'
            },
            relationTo: coursesCollectionSlug
        },
        {
            name: 'lesson',
            type: 'relationship',
            admin: {
                allowCreate: false,
                description: 'The lesson that the topic is associated with',
                position: 'sidebar'
            },
            relationTo: lessonsCollectionSlug
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
        access: withDefaultAccess(defaultAccess.topics, overrides?.access),
        admin: {
            useAsTitle: 'title',
            //  group: 'LMS',
            ...overrides?.admin
        },
        fields
    };
    return {
        ...baseConfig
    };
};

//# sourceMappingURL=topicsCollection.js.map