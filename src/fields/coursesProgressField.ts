import type { ArrayField } from 'payload'

/**
 * Props for the roles field configuration
 */
type Props = {
  coursesCollectionSlug?: string
  lessonsCollectionSlug?: string
  quizzesCollectionSlug?: string
  overrides?: Partial<ArrayField>
}

/**
 * Creates a field for the courses progress
 * @param props - Configuration overrides for the field
 * @returns A configured field for the courses progress
 */
export const coursesProgressField: (props: Props) => ArrayField = ({
  coursesCollectionSlug = 'courses',
  lessonsCollectionSlug = 'lessons',
  quizzesCollectionSlug = 'quizzes',
  overrides,
}) => {
  const field: ArrayField = {
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
          allowEdit: false,
        },
      },
      {
        name: 'completed',
        type: 'checkbox',
        defaultValue: false,
      },
      {
        name: 'completedAt',
        type: 'date',
        admin: {
          condition: (_, siblingData) => siblingData.completed === true,
        },
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
            required: true,
            filterOptions: ({ siblingData, data }) => {
            
              // @ts-ignore
              return {
                course: { 
                  // @ts-expect-error
                  equals: siblingData.course 
                }
              }
            },
          },
          {
            name: 'completedAt',
            type: 'date',
            required: true,
          },
        ],
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
            required: true,
          },
          {
            name: 'score',
            type: 'number',
            required: true,
          },
          {
            name: 'completedAt',
            type: 'date',
            required: true,
          },
        ],
      },
    ],
    ...overrides,
    admin: {
      ...overrides?.admin,
    },
  }

  return field
}
