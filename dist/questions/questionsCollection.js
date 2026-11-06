import { defaultAccess, withDefaultAccess } from '../access/defaultAccess.js';
import { isAdminOrAuthorFieldLevel } from '../access/isAdminOrAuthor.js';
import { isTrueFalseAnswer } from './trueFalseAnswers.js';
/**
 * Answer fields are graded server-side and must never be sent to students.
 */ const answerAccess = {
    read: isAdminOrAuthorFieldLevel
};
/**
 * Creates a questions collection configuration for Payload CMS
 * This collection manages questions for quizzes and assessments
 *
 * @param props - Configuration properties for the questions collection
 * @returns CollectionConfig object for questions
 */ export const questionsCollection = (props)=>{
    const { overrides, questionTypes, studentsCollectionSlug = 'users' } = props || {};
    const fieldsOverride = overrides?.fields;
    // Default question types
    const defaultQuestionTypes = [
        {
            label: 'Multiple Choice',
            value: 'multipleChoice'
        },
        {
            label: 'True/False',
            value: 'trueFalse'
        },
        {
            label: 'Sorting',
            value: 'sorting'
        },
        {
            label: 'Fill in the Blank',
            value: 'fillInBlank'
        },
        {
            label: 'Assessment',
            value: 'assessment'
        },
        {
            label: 'Essay/Open Answer',
            value: 'essay'
        },
        {
            label: 'Free Choice',
            value: 'freeChoice'
        },
        {
            label: 'Single Choice',
            value: 'singleChoice'
        }
    ];
    // Use provided question types or fall back to defaults
    const availableQuestionTypes = questionTypes || defaultQuestionTypes;
    /**
   * Default fields for the questions collection
   * Includes question details, access control, and content organization
   */ const defaultFields = [
        {
            name: 'title',
            type: 'text',
            admin: {
                description: 'The title of the question'
            },
            required: true
        },
        {
            name: 'points',
            type: 'number',
            admin: {
                description: 'Not used in the quiz score yet: the score is the percentage of questions answered correctly.',
                step: 0.1
            },
            defaultValue: 1,
            min: 0,
            required: true
        },
        {
            name: 'questionType',
            type: 'select',
            admin: {
                description: 'Only Multiple Choice, Single Choice and True/False are marked automatically. Any other type always counts as wrong, so a quiz that includes one cannot reach 100%.'
            },
            options: availableQuestionTypes,
            required: true
        },
        {
            name: 'question',
            type: 'text',
            admin: {
                description: 'The question as students see it.'
            },
            required: true
        },
        {
            name: 'choices',
            type: 'array',
            admin: {
                condition: (_, siblingData)=>[
                        'multipleChoice',
                        'singleChoice',
                        'sorting'
                    ].includes(siblingData.questionType),
                description: 'The answers students choose from.'
            },
            fields: [
                {
                    name: 'label',
                    type: 'text',
                    admin: {
                        description: 'The answer text students see.'
                    },
                    required: true
                },
                {
                    name: 'isCorrect',
                    type: 'checkbox',
                    access: answerAccess,
                    admin: {
                        description: 'Tick the right answer. Only one counts: if several are ticked, the first ticked choice is the answer. Hidden from students.'
                    }
                },
                {
                    name: 'order',
                    type: 'number',
                    admin: {
                        condition: (_, siblingData)=>siblingData.questionType === 'sorting',
                        description: 'Where this choice belongs in the correct order, starting at 1.'
                    }
                }
            ]
        },
        {
            // Text, not select: the stored values `true` and `false` are illegal GraphQL enum names.
            name: 'correctAnswer',
            type: 'text',
            access: answerAccess,
            admin: {
                components: {
                    Field: {
                        path: '@littledash/plugin-lms/ui/TrueFalseAnswer#TrueFalseAnswer'
                    }
                },
                condition: (_, siblingData)=>siblingData.questionType === 'trueFalse',
                description: 'The right answer. Both accepts either. Hidden from students.'
            },
            validate: (value)=>{
                if (value == null || value === '') {
                    return true;
                }
                return isTrueFalseAnswer(value) || 'Choose True, False, or Both.';
            }
        },
        {
            name: 'correctAnswers',
            type: 'array',
            access: answerAccess,
            admin: {
                condition: (_, siblingData)=>siblingData.questionType === 'fillInBlank',
                description: 'Answers to accept. Hidden from students.'
            },
            fields: [
                {
                    name: 'answer',
                    type: 'text',
                    admin: {
                        description: 'An accepted answer.'
                    },
                    required: true
                }
            ]
        },
        {
            name: 'assessmentCriteria',
            type: 'array',
            access: answerAccess,
            admin: {
                condition: (_, siblingData)=>siblingData.questionType === 'assessment',
                description: 'What a marker looks for, with points for each. Hidden from students.'
            },
            fields: [
                {
                    name: 'criterion',
                    type: 'text',
                    admin: {
                        description: 'One thing a good answer includes.'
                    },
                    required: true
                },
                {
                    name: 'points',
                    type: 'number',
                    admin: {
                        description: 'Points for meeting this criterion.'
                    },
                    required: true
                }
            ]
        },
        {
            name: 'maxLength',
            type: 'number',
            admin: {
                condition: (_, siblingData)=>siblingData.questionType === 'essay',
                description: 'The most characters an answer may have. Your quiz form must apply it: it is not checked when answers are submitted.'
            },
            defaultValue: 500
        },
        {
            name: 'authors',
            type: 'relationship',
            admin: {
                allowCreate: false,
                description: 'The authors of the question'
            },
            hasMany: true,
            relationTo: studentsCollectionSlug
        }
    ];
    // Apply field overrides if provided
    const fields = fieldsOverride && typeof fieldsOverride === 'function' ? fieldsOverride({
        defaultFields
    }) : defaultFields;
    /**
   * Base configuration for the questions collection
   * Includes slug, access control, timestamps, and admin settings
   */ const baseConfig = {
        slug: 'questions',
        timestamps: true,
        ...overrides,
        access: withDefaultAccess(defaultAccess.questions, overrides?.access),
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

//# sourceMappingURL=questionsCollection.js.map