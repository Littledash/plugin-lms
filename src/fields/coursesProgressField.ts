import type { ArrayField } from 'payload'

import { isAdminFieldLevel } from '../access/isAdmin.js'

/**
 * Props for the roles field configuration
 */
type Props = {
  coursesCollectionSlug?: string
  lessonsCollectionSlug?: string
  overrides?: Partial<ArrayField>
  quizzesCollectionSlug?: string
}

/**
 * Creates a field for the courses progress
 * @param props - Configuration overrides for the field
 * @returns A configured field for the courses progress
 */
export const coursesProgressField: (props: Props) => ArrayField = ({
  coursesCollectionSlug = 'courses',
  lessonsCollectionSlug = 'lessons',
  overrides,
  quizzesCollectionSlug = 'quizzes',
}) => {
  const field: ArrayField = {
    name: 'coursesProgress',
    type: 'array',
    // Written by the LMS services; users must not be able to edit their own progress
    access: {
      create: isAdminFieldLevel,
      update: isAdminFieldLevel,
    },
    fields: [
      {
        name: 'course',
        type: 'relationship',
        admin: {
          allowCreate: false,
          allowEdit: false,
        },
        hasMany: false,
        relationTo: coursesCollectionSlug,
        required: true,
      },
      {
        name: 'enrolledAt',
        type: 'date',
        admin: {
          description: 'When the student was enrolled. Access expiry and lesson release count from this date.',
          readOnly: true,
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
            hasMany: false,
            relationTo: lessonsCollectionSlug,
            required: true,
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
            hasMany: false,
            relationTo: quizzesCollectionSlug,
            required: true,
          },
          {
            name: 'score',
            type: 'number',
            required: true,
          },
          {
            name: 'attempts',
            type: 'number',
            defaultValue: 1,
          },
          {
            name: 'lastAttemptAt',
            type: 'date',
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
