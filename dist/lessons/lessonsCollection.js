import { defaultAccess, withDefaultAccess } from '../access/defaultAccess.js';
import { isAdminOrAuthorOrEnrolledInCourseFieldLevel } from '../access/isAdminOrAuthorOrEnrolledInCourse.js';
import { embeddedVideo } from '../fields/embeddedVideo.js';
import { videoProgression } from '../fields/videoProgression.js';
/**
 * Creates a lessons collection configuration for Payload CMS
 * This collection manages individual lessons within courses, including content, media, and assessments
 *
 * @param props - Configuration properties for the lessons collection
 * @returns CollectionConfig object for lessons
 */ export const lessonsCollection = (props)=>{
    const { categoriesCollectionSlug = 'categories', coursesCollectionSlug = 'courses', mediaCollectionSlug = 'media', overrides, quizzesCollectionSlug = 'quizzes', studentsCollectionSlug = 'users' } = props || {};
    const fieldsOverride = overrides?.fields;
    /**
   * Default fields for the lessons collection
   * Includes lesson content, media, progression control, and assessment relationships
   */ const defaultFields = [
        {
            name: 'title',
            type: 'text',
            admin: {
                description: 'The title of the lesson'
            },
            required: true
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
            access: {
                read: isAdminOrAuthorOrEnrolledInCourseFieldLevel
            },
            admin: {
                description: 'The content of the lesson'
            }
        },
        {
            name: 'authors',
            type: 'relationship',
            admin: {
                allowCreate: false,
                description: 'The authors of the lesson',
                position: 'sidebar'
            },
            hasMany: true,
            relationTo: studentsCollectionSlug
        },
        {
            name: 'featuredImage',
            type: 'upload',
            admin: {
                description: 'The featured image of the lesson',
                position: 'sidebar'
            },
            relationTo: mediaCollectionSlug
        },
        {
            type: 'tabs',
            tabs: [
                {
                    name: 'lessonSettings',
                    description: 'Controls the look and feel of the lesson and optional content settings',
                    fields: [
                        {
                            name: 'lessonMaterials',
                            type: 'richText',
                            access: {
                                read: isAdminOrAuthorOrEnrolledInCourseFieldLevel
                            },
                            admin: {
                                description: 'The materials of the lesson'
                            },
                            label: 'Lesson Materials'
                        },
                        {
                            name: 'downloadableFiles',
                            type: 'upload',
                            access: {
                                read: isAdminOrAuthorOrEnrolledInCourseFieldLevel
                            },
                            admin: {
                                description: 'The downloadable files of the lesson'
                            },
                            hasMany: true,
                            relationTo: mediaCollectionSlug
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
                                access: {
                                    read: isAdminOrAuthorOrEnrolledInCourseFieldLevel
                                },
                                admin: {
                                    condition: (data, { lessonVideo })=>Boolean(lessonVideo.embed)
                                }
                            }
                        })
                    ],
                    label: 'Lesson Settings'
                },
                {
                    name: 'accessSettings',
                    description: 'Controls the timing and way lessons can be accessed.',
                    fields: [
                        {
                            name: 'lessonReleaseSchedule',
                            type: 'select',
                            admin: {
                                description: 'The progression behavior of the lesson'
                            },
                            defaultValue: 'immediately',
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
                            ]
                        },
                        {
                            name: 'lessonRelaseDays',
                            type: 'number',
                            admin: {
                                condition: (data, { lessonReleaseSchedule })=>lessonReleaseSchedule === 'enrollment',
                                description: 'The number of days after enrollment the lesson will be released'
                            },
                            label: 'Day(s) after enrollment'
                        },
                        {
                            name: 'lessonReleaseDate',
                            type: 'date',
                            admin: {
                                condition: (data, { lessonReleaseSchedule })=>lessonReleaseSchedule === 'specificDate',
                                description: 'The date the lesson will be released'
                            }
                        }
                    ],
                    label: 'Access Settings'
                }
            ]
        },
        {
            name: 'categories',
            type: 'relationship',
            admin: {
                allowCreate: false,
                description: 'The categories that the lesson belongs to',
                position: 'sidebar'
            },
            relationTo: categoriesCollectionSlug
        },
        {
            name: 'course',
            type: 'relationship',
            admin: {
                allowCreate: false,
                description: 'The course that the lesson belongs to',
                position: 'sidebar'
            },
            hasMany: false,
            relationTo: coursesCollectionSlug
        },
        {
            name: 'quizzes',
            type: 'relationship',
            admin: {
                allowCreate: false,
                description: 'The quizzes that are part of the lesson',
                position: 'sidebar'
            },
            hasMany: true,
            relationTo: quizzesCollectionSlug
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
        access: withDefaultAccess(defaultAccess.lessons, overrides?.access),
        admin: {
            useAsTitle: 'title',
            // group: 'LMS',
            ...overrides?.admin
        },
        fields
    };
    return {
        ...baseConfig
    };
};

//# sourceMappingURL=lessonsCollection.js.map