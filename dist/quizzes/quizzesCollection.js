import { isAdminOrAuthorOrEnrolledInCourseFieldLevel } from '../access/isAdminOrAuthorOrEnrolledInCourse.js';
/**
 * Creates a quizzes collection configuration for Payload CMS
 * This collection manages quizzes and assessments
 *
 * @param props - Configuration properties for the quizzes collection
 * @returns CollectionConfig object for quizzes
 */ export const quizzesCollection = (props)=>{
    const { overrides, mediaCollectionSlug = 'media', studentsCollectionSlug = 'users' } = props || {};
    const fieldsOverride = overrides?.fields;
    /**
   * Default fields for the quizzes collection
   * Includes quiz details, access control, and content organization
   */ const defaultFields = [
        {
            name: 'title',
            type: 'text',
            required: true,
            admin: {
                description: 'The title of the quiz'
            }
        },
        {
            name: 'excerpt',
            type: 'text',
            admin: {
                description: 'The excerpt of the quiz'
            }
        },
        {
            name: 'description',
            type: 'richText',
            admin: {
                description: 'The description of the quiz'
            },
            access: {
                read: isAdminOrAuthorOrEnrolledInCourseFieldLevel
            }
        },
        {
            name: 'questions',
            type: 'relationship',
            relationTo: 'questions',
            hasMany: true,
            admin: {
                position: 'sidebar',
                allowCreate: false,
                description: 'The questions in this quiz'
            },
            access: {
                read: isAdminOrAuthorOrEnrolledInCourseFieldLevel
            }
        },
        {
            name: 'minimumScore',
            type: 'number',
            min: 0,
            max: 100,
            defaultValue: 100,
            admin: {
                description: 'Minimum score required (0-100) to pass the quiz'
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
                description: 'The authors of the quiz'
            }
        },
        {
            name: 'featuredImage',
            type: 'upload',
            relationTo: mediaCollectionSlug,
            admin: {
                position: 'sidebar',
                description: 'The featured image of the quiz'
            }
        }
    ];
    // Apply field overrides if provided
    const fields = fieldsOverride && typeof fieldsOverride === 'function' ? fieldsOverride({
        defaultFields
    }) : defaultFields;
    /**
   * Base configuration for the quizzes collection
   * Includes slug, access control, timestamps, and admin settings
   */ const baseConfig = {
        slug: 'quizzes',
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

//# sourceMappingURL=quizzesCollection.js.map