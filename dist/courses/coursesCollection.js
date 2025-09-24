import { pricesField } from '../fields/pricesField.js';
import { isAdminOrAuthorFieldLevel } from '../access/isAdminOrAuthor.js';
import { isAdminOrAuthorOrStudentFieldLevel } from '../access/isAdminOrAuthorOrStudent.js';
import { isAdminOrAuthorOrEnrolledInCourseFieldLevel } from '../access/isAdminOrAuthorOrEnrolledInCourse.js';
/**
 * Creates a courses collection configuration for Payload CMS
 * This collection manages educational courses with various access modes, pricing, and content organization
 *
 * @param props - Configuration properties for the courses collection
 * @returns CollectionConfig object for courses
 */ export const coursesCollection = (props)=>{
    const { overrides, mediaCollectionSlug = 'media', lessonsCollectionSlug = 'lessons', categoriesCollectionSlug = 'categories', tagsCollectionSlug = 'tags', currenciesConfig, studentsCollectionSlug = 'users', certificatesCollectionSlug = 'certificates' } = props || {};
    const fieldsOverride = overrides?.fields;
    /**
   * Default fields for the courses collection
   * Includes course details, access control, pricing, relationships, and content organization
   */ const defaultFields = [
        {
            name: 'title',
            type: 'text',
            required: true,
            admin: {
                description: 'The title of the course'
            }
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
            label: 'Course Lessons',
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
                        width: '50%',
                        description: 'Check if this lesson is optional'
                    }
                }
            ],
            access: {
                read: isAdminOrAuthorOrStudentFieldLevel
            }
        },
        {
            type: 'tabs',
            tabs: [
                {
                    label: 'Enrollment',
                    name: 'enrollment',
                    description: 'Controls how students gain access to the course',
                    fields: [
                        {
                            name: 'accessMode',
                            type: 'select',
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
                            required: true,
                            admin: {
                                description: 'Controls how students gain access to the course'
                            }
                        },
                        ...currenciesConfig ? [
                            pricesField({
                                currenciesConfig,
                                overrides: {
                                    admin: {
                                        condition: (_, siblingData)=>{
                                            return [
                                                'buy now',
                                                'recurring',
                                                'closed'
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
                                description: 'The URL for the enrollment page',
                                condition: (_, siblingData)=>siblingData?.accessMode === 'closed'
                            }
                        }
                    ]
                },
                {
                    label: 'Course Settings',
                    name: 'courseSettings',
                    description: 'Controls the look and feel of the course and optional content settings',
                    fields: [
                        {
                            name: 'courseMaterials',
                            type: 'richText',
                            admin: {
                                description: 'The materials that are part of the course'
                            },
                            access: {
                                read: isAdminOrAuthorOrEnrolledInCourseFieldLevel
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
                            fields: [
                                {
                                    type: 'row',
                                    fields: [
                                        {
                                            name: 'hours',
                                            type: 'number',
                                            label: 'hour(s)',
                                            admin: {
                                                description: 'The number of hours in the course',
                                                width: '50%'
                                            }
                                        },
                                        {
                                            name: 'minutes',
                                            type: 'number',
                                            label: 'minute(s)',
                                            admin: {
                                                width: '50%',
                                                description: 'The number of minutes in the course'
                                            }
                                        }
                                    ]
                                }
                            ],
                            admin: {
                                description: 'The duration of the course'
                            }
                        }
                    ]
                },
                {
                    label: 'Access Settings',
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
                                    ],
                                    admin: {
                                        width: '50%',
                                        description: 'What is required to satisfy this prerequisite'
                                    }
                                },
                                {
                                    name: 'minimumScore',
                                    type: 'number',
                                    min: 0,
                                    max: 100,
                                    admin: {
                                        width: '50%',
                                        description: 'Minimum score required (0-100)',
                                        condition: (_, siblingData)=>siblingData?.completionRequirement === 'minimumScore'
                                    }
                                },
                                {
                                    name: 'requiredLessons',
                                    type: 'relationship',
                                    relationTo: lessonsCollectionSlug,
                                    hasMany: true,
                                    admin: {
                                        width: '50%',
                                        description: 'Specific lessons that must be completed',
                                        condition: (_, siblingData)=>siblingData?.completionRequirement === 'specificLessons'
                                    }
                                },
                                {
                                    name: 'isOptional',
                                    type: 'checkbox',
                                    defaultValue: false,
                                    admin: {
                                        width: '50%',
                                        description: 'Whether this prerequisite is optional'
                                    }
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
                    ]
                },
                {
                    label: 'Awards',
                    name: 'awards',
                    description: 'Controls the awards settings of the course',
                    fields: [
                        {
                            name: 'certificate',
                            type: 'relationship',
                            relationTo: certificatesCollectionSlug,
                            hasMany: false,
                            admin: {
                                allowCreate: false,
                                description: 'The certificate that is awarded to the students who complete the course'
                            }
                        },
                        {
                            name: 'coursePoints',
                            type: 'number',
                            label: 'Course completion points',
                            admin: {
                                description: 'The points that are awarded to the students who complete the course'
                            }
                        }
                    ]
                },
                {
                    label: 'Navigation',
                    name: 'navigation',
                    description: 'Controls the navigation settings of the course',
                    fields: [
                        {
                            name: 'navigationMode',
                            type: 'select',
                            label: 'Course Navigation Mode',
                            defaultValue: 'linear',
                            required: true,
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
                            admin: {
                                description: 'Controls how students interact with the content and their navigational experience'
                            }
                        }
                    ]
                }
            ]
        },
        {
            name: 'enrolledStudents',
            type: 'relationship',
            relationTo: studentsCollectionSlug,
            hasMany: true,
            admin: {
                position: 'sidebar',
                allowCreate: false,
                description: 'Controls the students enrolled in the course'
            },
            access: {
                read: isAdminOrAuthorFieldLevel
            }
        },
        {
            name: 'courseCompletedStudents',
            type: 'relationship',
            relationTo: studentsCollectionSlug,
            hasMany: true,
            admin: {
                position: 'sidebar',
                allowCreate: false,
                description: 'The students completed the course'
            }
        },
        {
            name: 'courseEnrolledGroups',
            type: 'relationship',
            relationTo: 'groups',
            hasMany: true,
            label: 'Course Enrolled Groups',
            admin: {
                position: 'sidebar',
                allowCreate: false,
                allowEdit: false,
                description: 'Controls the groups enrolled in the course'
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
                description: 'The authors of the course'
            },
            access: {
                read: isAdminOrAuthorFieldLevel
            }
        },
        {
            name: 'categories',
            type: 'relationship',
            relationTo: categoriesCollectionSlug,
            hasMany: true,
            admin: {
                position: 'sidebar',
                allowCreate: false,
                description: 'The categories that are part of the course'
            }
        },
        {
            name: 'tags',
            type: 'relationship',
            relationTo: tagsCollectionSlug,
            hasMany: true,
            admin: {
                position: 'sidebar',
                allowCreate: false,
                description: 'The tags that are part of the course'
            }
        },
        {
            name: 'featuredImage',
            type: 'upload',
            relationTo: mediaCollectionSlug,
            admin: {
                position: 'sidebar',
                description: 'The featured image of the course'
            }
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