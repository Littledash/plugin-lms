import { isAdminFieldLevel } from '../access/isAdmin.js';
/**
 * Creates a field for the courses progress
 * @param props - Configuration overrides for the field
 * @returns A configured field for the courses progress
 */ export const coursesProgressField = ({ coursesCollectionSlug = 'courses', lessonsCollectionSlug = 'lessons', overrides, quizzesCollectionSlug = 'quizzes' })=>{
    const field = {
        name: 'coursesProgress',
        type: 'array',
        // Written by the LMS services; users must not be able to edit their own progress
        access: {
            create: isAdminFieldLevel,
            update: isAdminFieldLevel
        },
        fields: [
            {
                name: 'course',
                type: 'relationship',
                admin: {
                    allowCreate: false,
                    allowEdit: false
                },
                hasMany: false,
                relationTo: coursesCollectionSlug,
                required: true
            },
            {
                name: 'enrolledAt',
                type: 'date',
                admin: {
                    description: 'When the student was enrolled. Lesson release delays count from this date, and access expiry too unless the access was renewed.',
                    readOnly: true
                }
            },
            {
                name: 'accessFrom',
                type: 'date',
                admin: {
                    description: 'Set when access is renewed by a purchase. Access expiry counts from this date instead of the enrollment date.',
                    readOnly: true
                }
            },
            {
                name: 'completed',
                type: 'checkbox',
                defaultValue: false
            },
            {
                name: 'completedAt',
                type: 'date',
                admin: {
                    condition: (_, siblingData)=>siblingData.completed === true
                }
            },
            {
                name: 'completedLessons',
                type: 'array',
                fields: [
                    {
                        name: 'lesson',
                        type: 'relationship',
                        hasMany: false,
                        relationTo: lessonsCollectionSlug,
                        required: true
                    },
                    {
                        name: 'completedAt',
                        type: 'date',
                        required: true
                    }
                ]
            },
            {
                name: 'completedQuizzes',
                type: 'array',
                fields: [
                    {
                        name: 'quiz',
                        type: 'relationship',
                        hasMany: false,
                        relationTo: quizzesCollectionSlug,
                        required: true
                    },
                    {
                        name: 'score',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'attempts',
                        type: 'number',
                        defaultValue: 1
                    },
                    {
                        name: 'lastAttemptAt',
                        type: 'date'
                    },
                    {
                        name: 'completedAt',
                        type: 'date',
                        required: true
                    }
                ]
            }
        ],
        ...overrides,
        admin: {
            ...overrides?.admin
        }
    };
    return field;
};

//# sourceMappingURL=coursesProgressField.js.map