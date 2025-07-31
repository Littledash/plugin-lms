/**
 * Creates a field for the courses progress
 * @param props - Configuration overrides for the field
 * @returns A configured field for the courses progress
 */ export const coursesProgressField = ({ coursesCollectionSlug = 'courses', lessonsCollectionSlug = 'lessons', quizzesCollectionSlug = 'quizzes', overrides })=>{
    const field = {
        name: 'coursesProgress',
        type: 'array',
        fields: [
            {
                name: 'course',
                type: 'relationship',
                relationTo: coursesCollectionSlug,
                hasMany: false,
                required: true,
                admin: {
                    allowCreate: false,
                    allowEdit: false
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
                        relationTo: lessonsCollectionSlug,
                        hasMany: false,
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
                        relationTo: quizzesCollectionSlug,
                        hasMany: false,
                        required: true
                    },
                    {
                        name: 'score',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'completedAt',
                        type: 'date',
                        required: true
                    },
                    {
                        name: 'timeSpent',
                        type: 'number',
                        admin: {
                            description: 'Time spent on quiz in seconds'
                        }
                    },
                    {
                        name: 'attempts',
                        type: 'number',
                        defaultValue: 1,
                        admin: {
                            description: 'Number of attempts taken'
                        }
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