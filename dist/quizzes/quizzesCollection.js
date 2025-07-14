import { isAdminOrAuthorOrStudent } from '../access/isAdminOrAuthorOrStudent.js';
import { isAdminOrAuthor } from '../access/isAdminOrAuthor.js';
import { isAdminOrAuthorOrEnrolledInCourseFieldLevel } from '../access/isAdminOrAuthorOrEnrolledInCourse.js';
/**
 * Creates a quizzes collection configuration for Payload CMS
 * This collection manages quizzes and assessments
 *
 * @param props - Configuration properties for the quizzes collection
 * @returns CollectionConfig object for quizzes
 */ export const quizzesCollection = (props)=>{
    const { overrides, mediaCollectionSlug = 'media' } = props || {};
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
            required: true,
            admin: {
                description: 'The description of the quiz'
            },
            access: {
                read: isAdminOrAuthorOrEnrolledInCourseFieldLevel
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
        },
        {
            name: 'questions',
            type: 'relationship',
            relationTo: 'questions',
            hasMany: true,
            required: true,
            admin: {
                description: 'The questions in this quiz'
            },
            access: {
                read: isAdminOrAuthorOrEnrolledInCourseFieldLevel
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
        access: {
            read: isAdminOrAuthorOrStudent,
            create: isAdminOrAuthor,
            update: isAdminOrAuthor,
            delete: isAdminOrAuthor
        },
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

//# sourceMappingURL=quizzesCollection.js.map