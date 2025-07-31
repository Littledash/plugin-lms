import { embeddedVideo } from '../fields/embeddedVideo.js';
import { isAdminOrAuthorOrEnrolledInCourseFieldLevel } from '../access/isAdminOrAuthorOrEnrolledInCourse.js';
import { videoProgression } from '../fields/videoProgression.js';
/**
 * Creates a lessons collection configuration for Payload CMS
 * This collection manages individual lessons within courses, including content, media, and assessments
 *
 * @param props - Configuration properties for the lessons collection
 * @returns CollectionConfig object for lessons
 */ export const lessonsCollection = (props)=>{
    const { overrides, mediaCollectionSlug = 'media', coursesCollectionSlug = 'courses', quizzesCollectionSlug = 'quizzes', categoriesCollectionSlug = 'categories', studentsCollectionSlug = 'users' } = props || {};
    const fieldsOverride = overrides?.fields;
    /**
   * Default fields for the lessons collection
   * Includes lesson content, media, progression control, and assessment relationships
   */ const defaultFields = [
        {
            name: 'title',
            type: 'text',
            required: true,
            admin: {
                description: 'The title of the lesson'
            }
        },
        {
            name: 'excerpt',
            type: 'textarea',
            admin: {
                description: 'The excerpt of the lesson'
            }
        },
        {
            name: 'content',
            type: 'richText',
            admin: {
                description: 'The content of the lesson'
            },
            access: {
                read: isAdminOrAuthorOrEnrolledInCourseFieldLevel
            }
        },
        {
            name: 'authors',
            type: 'relationship',
            relationTo: studentsCollectionSlug,
            hasMany: true,
            admin: {
                position: 'sidebar',
                allowCreate: false,
                description: 'The authors of the lesson'
            }
        },
        {
            name: 'featuredImage',
            type: 'upload',
            relationTo: mediaCollectionSlug,
            admin: {
                position: 'sidebar',
                description: 'The featured image of the lesson'
            }
        },
        {
            type: 'tabs',
            tabs: [
                {
                    name: 'lessonSettings',
                    label: 'Lesson Settings',
                    description: 'Controls the look and feel of the lesson and optional content settings',
                    fields: [
                        {
                            name: 'lessonMaterials',
                            type: 'richText',
                            label: 'Lesson Materials',
                            admin: {
                                description: 'The materials of the lesson'
                            },
                            access: {
                                read: isAdminOrAuthorOrEnrolledInCourseFieldLevel
                            }
                        },
                        embeddedVideo({
                            mediaCollectionSlug,
                            overrides: {
                                name: 'lessonVideo',
                                access: {
                                    read: isAdminOrAuthorOrEnrolledInCourseFieldLevel
                                },
                                admin: {
                                    description: 'The below video is tied to Course progression'
                                }
                            }
                        }),
                        videoProgression({
                            overrides: {
                                admin: {
                                    condition: (data, { lessonVideo })=>Boolean(lessonVideo.embed)
                                },
                                access: {
                                    read: isAdminOrAuthorOrEnrolledInCourseFieldLevel
                                }
                            }
                        })
                    ]
                },
                {
                    label: 'Access Settings',
                    name: 'accessSettings',
                    description: 'Controls the timing and way lessons can be accessed.',
                    fields: [
                        {
                            name: 'lessonReleaseSchedule',
                            type: 'select',
                            label: 'Progression Behavior',
                            options: [
                                {
                                    label: 'Immediately',
                                    value: 'immediately'
                                },
                                {
                                    label: 'Enrollment',
                                    value: 'enrollment'
                                },
                                {
                                    label: 'Specific Date',
                                    value: 'specificDate'
                                }
                            ],
                            defaultValue: 'immediately',
                            admin: {
                                description: 'The progression behavior of the lesson'
                            }
                        },
                        {
                            name: 'lessonRelaseDays',
                            type: 'number',
                            label: 'Day(s) after enrollment',
                            admin: {
                                description: 'The number of days after enrollment the lesson will be released',
                                condition: (data, { lessonReleaseSchedule })=>lessonReleaseSchedule === 'enrollment'
                            }
                        },
                        {
                            name: 'lessonReleaseDate',
                            type: 'date',
                            admin: {
                                description: 'The date the lesson will be released',
                                condition: (data, { lessonReleaseSchedule })=>lessonReleaseSchedule === 'specificDate'
                            }
                        }
                    ]
                }
            ]
        },
        {
            name: 'categories',
            type: 'relationship',
            relationTo: categoriesCollectionSlug,
            admin: {
                position: 'sidebar',
                allowCreate: false,
                description: 'The categories that the lesson belongs to'
            }
        },
        {
            name: 'course',
            type: 'relationship',
            relationTo: coursesCollectionSlug,
            hasMany: false,
            admin: {
                position: 'sidebar',
                allowCreate: false,
                description: 'The course that the lesson belongs to'
            }
        },
        {
            name: 'quizzes',
            type: 'array',
            admin: {
                position: 'sidebar',
                description: 'The quizzes that are part of the lesson with their order and timing'
            },
            fields: [
                {
                    name: 'quiz',
                    type: 'join',
                    collection: quizzesCollectionSlug,
                    on: 'lesson',
                    required: true
                },
                {
                    name: 'order',
                    type: 'number',
                    required: true,
                    admin: {
                        width: '50%',
                        description: 'The order of the quiz in the lesson'
                    }
                },
                {
                    name: 'isRequired',
                    type: 'checkbox',
                    defaultValue: true,
                    admin: {
                        width: '50%',
                        description: 'Whether this quiz is required to complete the lesson'
                    }
                },
                {
                    name: 'releaseSchedule',
                    type: 'select',
                    defaultValue: 'immediately',
                    options: [
                        {
                            label: 'Immediately',
                            value: 'immediately'
                        },
                        {
                            label: 'After Previous Quiz',
                            value: 'afterPrevious'
                        },
                        {
                            label: 'Specific Date',
                            value: 'specificDate'
                        }
                    ],
                    admin: {
                        width: '50%',
                        description: 'When this quiz becomes available'
                    }
                },
                {
                    name: 'releaseDate',
                    type: 'date',
                    admin: {
                        width: '50%',
                        description: 'The date the quiz will be released',
                        condition: (_, siblingData)=>siblingData?.releaseSchedule === 'specificDate'
                    }
                },
                {
                    name: 'prerequisiteQuizzes',
                    type: 'relationship',
                    relationTo: quizzesCollectionSlug,
                    hasMany: true,
                    admin: {
                        width: '50%',
                        description: 'Quizzes that must be completed before this one',
                        condition: (_, siblingData)=>siblingData?.releaseSchedule === 'afterPrevious'
                    }
                }
            ]
        }
    ];
    // Apply field overrides if provided
    const fields = fieldsOverride && typeof fieldsOverride === 'function' ? fieldsOverride({
        defaultFields
    }) : defaultFields;
    /**
   * Base configuration for the lessons collection
   * Includes slug, access control, timestamps, and admin settings
   */ const baseConfig = {
        slug: 'lessons',
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

//# sourceMappingURL=lessonsCollection.js.map