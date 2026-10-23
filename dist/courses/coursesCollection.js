import { defaultAccess, withDefaultAccess } from '../access/defaultAccess.js';
import { isAdminOrAuthorFieldLevel } from '../access/isAdminOrAuthor.js';
import { isAdminOrAuthorOrEnrolledInThisCourseFieldLevel } from '../access/isAdminOrAuthorOrEnrolledInCourse.js';
import { isAdminOrAuthorOrStudentFieldLevel } from '../access/isAdminOrAuthorOrStudent.js';
import { pricesField } from '../fields/pricesField.js';
/**
 * Creates a courses collection configuration for Payload CMS
 * This collection manages educational courses with various access modes, pricing, and content organization
 *
 * @param props - Configuration properties for the courses collection
 * @returns CollectionConfig object for courses
 */ export const coursesCollection = (props)=>{
    const { categoriesCollectionSlug = 'categories', certificatesCollectionSlug = 'certificates', currenciesConfig, lessonsCollectionSlug = 'lessons', mediaCollectionSlug = 'media', overrides, studentsCollectionSlug = 'users', tagsCollectionSlug = 'tags' } = props || {};
    const fieldsOverride = overrides?.fields;
    /**
   * Default fields for the courses collection
   * Includes course details, access control, pricing, relationships, and content organization
   */ const defaultFields = [
        {
            name: 'title',
            type: 'text',
            admin: {
                description: 'The title of the course'
            },
            required: true
        },
        {
            name: 'excerpt',
            type: 'textarea',
            admin: {
                description: 'The excerpt of the course'
            }
        },
        {
            name: 'description',
            type: 'richText',
            admin: {
                description: 'The description of the course'
            }
        },
        {
            name: 'lessons',
            type: 'array',
            access: {
                read: isAdminOrAuthorOrStudentFieldLevel
            },
            admin: {
                description: 'The lessons that are part of the course in specific order'
            },
            fields: [
                {
                    name: 'lesson',
                    type: 'relationship',
                    relationTo: lessonsCollectionSlug,
                    required: true
                },
                {
                    name: 'isOptional',
                    type: 'checkbox',
                    admin: {
                        description: 'Check if this lesson is optional',
                        width: '50%'
                    }
                }
            ],
            label: 'Course Lessons'
        },
        {
            type: 'tabs',
            tabs: [
                {
                    name: 'enrollment',
                    description: 'Controls how students gain access to the course',
                    fields: [
                        {
                            name: 'accessMode',
                            type: 'select',
                            admin: {
                                description: 'Controls how students gain access to the course'
                            },
                            defaultValue: 'open',
                            options: [
                                {
                                    label: 'Open',
                                    value: 'open'
                                },
                                {
                                    label: 'Free',
                                    value: 'free'
                                },
                                {
                                    label: 'Buy Now',
                                    value: 'buy now'
                                },
                                {
                                    label: 'Recurring',
                                    value: 'recurring'
                                },
                                {
                                    label: 'Closed',
                                    value: 'closed'
                                }
                            ],
                            required: true
                        },
                        ...currenciesConfig ? [
                            pricesField({
                                currenciesConfig,
                                overrides: {
                                    admin: {
                                        condition: (_, siblingData)=>{
                                            return [
                                                'buy now',
                                                'closed',
                                                'recurring'
                                            ].includes(siblingData?.accessMode);
                                        }
                                    }
                                }
                            })
                        ] : [],
                        {
                            name: 'enrollmentUrl',
                            type: 'text',
                            admin: {
                                condition: (_, siblingData)=>siblingData?.accessMode === 'closed',
                                description: 'The URL for the enrollment page'
                            }
                        }
                    ],
                    label: 'Enrollment'
                },
                {
                    name: 'courseSettings',
                    description: 'Controls the look and feel of the course and optional content settings',
                    fields: [
                        {
                            name: 'courseMaterials',
                            type: 'richText',
                            access: {
                                read: isAdminOrAuthorOrEnrolledInThisCourseFieldLevel
                            },
                            admin: {
                                description: 'The materials that are part of the course'
                            }
                        },
                        {
                            name: 'accessExpirationDays',
                            type: 'number',
                            admin: {
                                description: 'The number of days after which the access to the course will expire'
                            }
                        },
                        {
                            name: 'duration',
                            type: 'group',
                            admin: {
                                description: 'The duration of the course'
                            },
                            fields: [
                                {
                                    type: 'row',
                                    fields: [
                                        {
                                            name: 'hours',
                                            type: 'number',
                                            admin: {
                                                description: 'The number of hours in the course',
                                                width: '50%'
                                            },
                                            label: 'hour(s)'
                                        },
                                        {
                                            name: 'minutes',
                                            type: 'number',
                                            admin: {
                                                description: 'The number of minutes in the course',
                                                width: '50%'
                                            },
                                            label: 'minute(s)'
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    label: 'Course Settings'
                },
                {
                    name: 'accessSettings',
                    description: 'Controls additional requirements and restrictions that enrollees need to meet to access the course',
                    fields: [
                        {
                            name: 'prerequisiteCourses',
                            type: 'array',
                            admin: {
                                description: 'Courses that a student must complete before enrolling in this course with completion criteria.'
                            },
                            fields: [
                                {
                                    name: 'course',
                                    type: 'relationship',
                                    relationTo: 'courses',
                                    required: true
                                },
                                {
                                    name: 'completionRequirement',
                                    type: 'select',
                                    admin: {
                                        description: 'What is required to satisfy this prerequisite',
                                        width: '50%'
                                    },
                                    defaultValue: 'complete',
                                    options: [
                                        {
                                            label: 'Complete Course',
                                            value: 'complete'
                                        },
                                        {
                                            label: 'Pass Final Quiz',
                                            value: 'passQuiz'
                                        },
                                        {
                                            label: 'Minimum Score',
                                            value: 'minimumScore'
                                        },
                                        {
                                            label: 'Complete Specific Lessons',
                                            value: 'specificLessons'
                                        }
                                    ]
                                },
                                {
                                    name: 'minimumScore',
                                    type: 'number',
                                    admin: {
                                        condition: (_, siblingData)=>siblingData?.completionRequirement === 'minimumScore',
                                        description: 'Minimum score required (0-100)',
                                        width: '50%'
                                    },
                                    max: 100,
                                    min: 0
                                },
                                {
                                    name: 'requiredLessons',
                                    type: 'relationship',
                                    admin: {
                                        condition: (_, siblingData)=>siblingData?.completionRequirement === 'specificLessons',
                                        description: 'Specific lessons that must be completed',
                                        width: '50%'
                                    },
                                    hasMany: true,
                                    relationTo: lessonsCollectionSlug
                                },
                                {
                                    name: 'isOptional',
                                    type: 'checkbox',
                                    admin: {
                                        description: 'Whether this prerequisite is optional',
                                        width: '50%'
                                    },
                                    defaultValue: false
                                }
                            ]
                        },
                        {
                            name: 'requiredPoints',
                            type: 'number',
                            admin: {
                                description: 'The points that are required to access this course'
                            }
                        },
                        {
                            name: 'studentLimit',
                            type: 'number',
                            admin: {
                                description: 'The number of students that can enroll in the course'
                            }
                        }
                    ],
                    label: 'Access Settings'
                },
                {
                    name: 'awards',
                    description: 'Controls the awards settings of the course',
                    fields: [
                        {
                            name: 'certificate',
                            type: 'relationship',
                            admin: {
                                allowCreate: false,
                                description: 'The certificate that is awarded to the students who complete the course'
                            },
                            hasMany: false,
                            relationTo: certificatesCollectionSlug
                        },
                        {
                            name: 'coursePoints',
                            type: 'number',
                            admin: {
                                description: 'The points that are awarded to the students who complete the course'
                            },
                            label: 'Course completion points'
                        }
                    ],
                    label: 'Awards'
                },
                {
                    name: 'navigation',
                    description: 'Controls the navigation settings of the course',
                    fields: [
                        {
                            name: 'navigationMode',
                            type: 'select',
                            admin: {
                                description: 'Controls how students interact with the content and their navigational experience'
                            },
                            defaultValue: 'linear',
                            label: 'Course Navigation Mode',
                            options: [
                                {
                                    label: 'Linear',
                                    value: 'linear'
                                },
                                {
                                    label: 'Free Form',
                                    value: 'free'
                                }
                            ],
                            required: true
                        }
                    ],
                    label: 'Navigation'
                }
            ]
        },
        {
            name: 'enrolledStudents',
            type: 'relationship',
            access: {
                read: isAdminOrAuthorFieldLevel
            },
            admin: {
                allowCreate: false,
                description: 'Controls the students enrolled in the course',
                position: 'sidebar'
            },
            hasMany: true,
            relationTo: studentsCollectionSlug
        },
        {
            name: 'courseCompletedStudents',
            type: 'relationship',
            admin: {
                allowCreate: false,
                description: 'The students completed the course',
                position: 'sidebar'
            },
            hasMany: true,
            relationTo: studentsCollectionSlug
        },
        {
            name: 'courseEnrolledGroups',
            type: 'relationship',
            admin: {
                allowCreate: false,
                allowEdit: false,
                description: 'Controls the groups enrolled in the course',
                position: 'sidebar'
            },
            hasMany: true,
            label: 'Course Enrolled Groups',
            relationTo: 'groups'
        },
        {
            name: 'authors',
            type: 'relationship',
            access: {
                read: isAdminOrAuthorFieldLevel
            },
            admin: {
                allowCreate: false,
                description: 'The authors of the course',
                position: 'sidebar'
            },
            hasMany: true,
            relationTo: studentsCollectionSlug
        },
        {
            name: 'categories',
            type: 'relationship',
            admin: {
                allowCreate: false,
                description: 'The categories that are part of the course',
                position: 'sidebar'
            },
            hasMany: true,
            relationTo: categoriesCollectionSlug
        },
        {
            name: 'tags',
            type: 'relationship',
            admin: {
                allowCreate: false,
                description: 'The tags that are part of the course',
                position: 'sidebar'
            },
            hasMany: true,
            relationTo: tagsCollectionSlug
        },
        {
            name: 'featuredImage',
            type: 'upload',
            admin: {
                description: 'The featured image of the course',
                position: 'sidebar'
            },
            relationTo: mediaCollectionSlug
        }
    ];
    // Apply field overrides if provided
    const fields = fieldsOverride && typeof fieldsOverride === 'function' ? fieldsOverride({
        defaultFields
    }) : defaultFields;
    /**
   * Base configuration for the courses collection
   * Includes slug, access control, timestamps, and admin settings
   */ const baseConfig = {
        slug: 'courses',
        timestamps: true,
        ...overrides,
        access: withDefaultAccess(defaultAccess.courses, overrides?.access),
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

//# sourceMappingURL=coursesCollection.js.map