import { CollectionConfig, Field } from 'payload';
import { FieldsOverride } from '../types.js';
import { embeddedVideo } from '../fields/embeddedVideo.js';

type Props = {
    coursesCollectionSlug?: string
    mediaCollectionSlug?: string
    quizzesCollectionSlug?: string
    overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}


export const lessonsCollection: (props?: Props) => CollectionConfig = (props) => {
  const { overrides, mediaCollectionSlug = 'media', coursesCollectionSlug = 'courses', quizzesCollectionSlug = 'quizzes' } = props || {}
  const fieldsOverride = overrides?.fields

  const defaultFields: Field[] = [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'The title of the lesson',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description: 'The content of the lesson',
      },
    },
    {
      name: 'excerpt',
      type: 'text',
      admin: {
        description: 'The excerpt of the lesson',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: mediaCollectionSlug,
      admin: {
        position: 'sidebar',
        description: 'The featured image of the lesson',
      },
    },
    {
      name: 'course',
      type: 'relationship',
      relationTo: coursesCollectionSlug,
      admin: {
        description: 'The course that the lesson belongs to',
      },
    },
    embeddedVideo({
      mediaCollectionSlug,
    }),
    {
      name: 'lessonMaterials',
      type: 'richText',
      label: 'Lesson Materials',
      admin: {
        description: 'The materials of the lesson',
      },
    },
    {
      name: 'progressionControl',
      type: 'select',
      label: 'Progression Behavior',
      options: [
        { label: 'Required to complete', value: 'required' },
        { label: 'Optional', value: 'optional' },
      ],
      defaultValue: 'required',
      admin: {
        description: 'The progression behavior of the lesson',
      },
    },
    {
      name: 'lessonOrder',
      type: 'number',
      label: 'Lesson Order',
      admin: {
        description: 'The order of the lesson in the course',
      },
    },
    {
      name: 'quizzes',
      type: 'relationship',
      relationTo: quizzesCollectionSlug,
      hasMany: true,
      admin: {
        description: 'The quizzes that are part of the lesson',
      },
    },
  ]

  const fields =
  fieldsOverride && typeof fieldsOverride === 'function'
    ? fieldsOverride({ defaultFields })
    : defaultFields

    const baseConfig: CollectionConfig = {
      slug: 'lessons',
      access: {
        // TODO: Add access control
        read: () => true,
      },
      timestamps: true,
      ...overrides,
      admin: {
        useAsTitle: 'title',
        ...overrides?.admin,
      },
      fields,
    }
  
    return { ...baseConfig }

}
