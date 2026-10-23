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
                description: 'Points awarded for correct answer',
                step: 0.1
            },
            defaultValue: 1,
            min: 0,
            required: true
        },
        {
            name: 'questionType',
            type: 'select',
            options: availableQuestionTypes,
            required: true
        },
        {
            name: 'question',
            type: 'text',
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
                    ].includes(siblingData.questionType)
            },
            fields: [
                {
                    name: 'label',
                    type: 'text',
                    required: true
                },
                {
                    name: 'isCorrect',
                    type: 'checkbox',
                    access: answerAccess
                },
                {
                    name: 'order',
                    type: 'number',
                    admin: {
                        condition: (_, siblingData)=>siblingData.questionType === 'sorting'
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
                condition: (_, siblingData)=>siblingData.questionType === 'trueFalse'
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
                condition: (_, siblingData)=>siblingData.questionType === 'fillInBlank'
            },
            fields: [
                {
                    name: 'answer',
                    type: 'text',
                    required: true
                }
            ]
        },
        {
            name: 'assessmentCriteria',
            type: 'array',
            access: answerAccess,
            admin: {
                condition: (_, siblingData)=>siblingData.questionType === 'assessment'
            },
            fields: [
                {
                    name: 'criterion',
                    type: 'text',
                    required: true
                },
                {
                    name: 'points',
                    type: 'number',
                    required: true
                }
            ]
        },
        {
            name: 'maxLength',
            type: 'number',
            admin: {
                condition: (_, siblingData)=>siblingData.questionType === 'essay'
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