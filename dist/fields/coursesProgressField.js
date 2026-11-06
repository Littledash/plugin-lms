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
                    allowEdit: false,
                    description: 'The course this progress is for.'
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
                name: 'renewals',
                type: 'array',
                admin: {
                    description: 'Purchases applied to this course. A purchase is only ever applied once.',
                    readOnly: true
                },
                fields: [
                    {
                        name: 'key',
                        type: 'text',
                        admin: {
                            description: 'Identifies the purchase, usually its order ID.'
                        },
                        required: true
                    },
                    {
                        name: 'renewedAt',
                        type: 'date',
                        admin: {
                            description: 'When this purchase renewed access.'
                        }
                    }
                ]
            },
            {
                name: 'completed',
                type: 'checkbox',
                admin: {
                    description: 'Ticked when the student finishes every lesson and passes every quiz in the course. Set by the LMS; tick it by hand only to mark a course complete without the work.'
                },
                defaultValue: false
            },
            {
                name: 'completedAt',
                type: 'date',
                admin: {
                    condition: (_, siblingData)=>siblingData.completed === true,
                    description: 'When the course was completed. Certificates are dated with this.'
                }
            },
            {
                name: 'completedLessons',
                type: 'array',
                admin: {
                    description: 'Lessons the student has finished in this course, with when.'
                },
                fields: [
                    {
                        name: 'lesson',
                        type: 'relationship',
                        admin: {
                            description: 'The finished lesson.'
                        },
                        hasMany: false,
                        relationTo: lessonsCollectionSlug,
                        required: true
                    },
                    {
                        name: 'completedAt',
                        type: 'date',
                        admin: {
                            description: 'When the student finished the lesson.'
                        },
                        required: true
                    }
                ]
            },
            {
                name: 'completedQuizzes',
                type: 'array',
                admin: {
                    description: 'Quizzes the student has attempted in this course, passed or not, with their best score.'
                },
                fields: [
                    {
                        name: 'quiz',
                        type: 'relationship',
                        admin: {
                            description: 'The quiz attempted.'
                        },
                        hasMany: false,
                        relationTo: quizzesCollectionSlug,
                        required: true
                    },
                    {
                        name: 'score',
                        type: 'number',
                        admin: {
                            description: "Best score so far: the percentage of questions answered correctly. It passes at the quiz's minimum score."
                        },
                        required: true
                    },
                    {
                        name: 'attempts',
                        type: 'number',
                        admin: {
                            description: "How many times the student has submitted this quiz. Counts toward the quiz's attempt limit."
                        },
                        defaultValue: 1
                    },
                    {
                        name: 'lastAttemptAt',
                        type: 'date',
                        admin: {
                            description: 'When the latest attempt was submitted. The retry wait counts from this.'
                        }
                    },
                    {
                        name: 'completedAt',
                        type: 'date',
                        admin: {
                            description: 'When the best score was achieved.'
                        },
                        required: true
                    }
                ]
            }
        ],
        ...overrides,
        admin: {
            description: 'One entry per course the student is enrolled in: enrollment and access dates, finished lessons and quiz results. Only admins can change it; the LMS updates it as the student works through the course.',
            ...overrides?.admin
        }
    };
    return field;
};

//# sourceMappingURL=coursesProgressField.js.map