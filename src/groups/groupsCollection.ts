import { CollectionConfig } from 'payload'
import { slugField } from '../fields/slug.js'
import { isAdminOrGroupLeader } from '../access/isAdminOrGroupLeader.js'
import { isMemberOfGroup } from '../access/isMemberOfGroup.js'
import { FieldsOverride } from '../types.js'

type Props = {
  coursesCollectionSlug?: string
  usersCollectionSlug?: string
  certificatesCollectionSlug?: string
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}

export const groupsCollection: (props?: Props) => CollectionConfig = (props) => {
  const {
    overrides,
    coursesCollectionSlug = 'courses',
    usersCollectionSlug = 'users',
    certificatesCollectionSlug = 'certificates',
  } = props || {}

  const fieldsOverride = overrides?.fields

  const defaultFields: CollectionConfig['fields'] = [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    ...slugField(),
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'courses',
      type: 'relationship',
      relationTo: coursesCollectionSlug,
      hasMany: true,
    },
    {
      name: 'users',
      type: 'relationship',
      relationTo: usersCollectionSlug,
      hasMany: true,
    },
    {
      name: 'leaders',
      type: 'relationship',
      relationTo: usersCollectionSlug,
      hasMany: true,
      filterOptions: ({ user }) => {
        if (user && user.roles.includes('admin')) {
          return {}
        }
        return {
          roles: {
            contains: ['instructor', 'leader'],
          },
        }
      },
    },
    {
      name: 'accessMode',
      type: 'select',
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Buy Now', value: 'buy_now' },
        { label: 'Recurring', value: 'recurring' },
        { label: 'Closed', value: 'closed' },
      ],
      defaultValue: 'free',
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      admin: {
        condition: (_, siblingData) =>
          siblingData.accessMode === 'buy_now' || siblingData.accessMode === 'recurring',
      },
    },
    {
      name: 'billingCycle',
      type: 'group',
      admin: {
        condition: (_, siblingData) => siblingData.accessMode === 'recurring',
      },
      fields: [
        {
          name: 'interval',
          type: 'select',
          options: [
            { label: 'Day', value: 'day' },
            { label: 'Week', value: 'week' },
            { label: 'Month', value: 'month' },
            { label: 'Year', value: 'year' },
          ],
          required: true,
        },
        {
          name: 'frequency',
          type: 'number',
          required: true,
        },
      ],
    },
    {
      name: 'startDate',
      type: 'date',
    },
    {
      name: 'endDate',
      type: 'date',
    },
    {
      name: 'studentLimit',
      type: 'number',
    },
    {
      name: 'materials',
      type: 'richText',
    },
    {
      name: 'certificate',
      type: 'relationship',
      relationTo: certificatesCollectionSlug,
    },
    {
      name: 'contentVisibility',
      type: 'select',
      options: [
        { label: 'Always visible', value: 'always' },
        { label: 'Only visible to enrollees', value: 'enrolled' },
      ],
      defaultValue: 'always',
    },
    {
      name: 'customPagination',
      type: 'number',
      defaultValue: 20,
    },
    {
      name: 'order',
      type: 'select',
      options: [
        { label: 'Date Ascending', value: 'date_asc' },
        { label: 'Date Descending', value: 'date_desc' },
        { label: 'Title Ascending', value: 'title_asc' },
        { label: 'Title Descending', value: 'title_desc' },
      ],
      defaultValue: 'date_desc',
    },
  ]

  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields })
      : defaultFields

  const baseConfig: CollectionConfig = {
    slug: 'groups',
    admin: {
      useAsTitle: 'title',
      // group: 'LMS',
      ...overrides?.admin,
    },
    access: {
      create: isAdminOrGroupLeader,
      read: isMemberOfGroup,
      update: isAdminOrGroupLeader,
      delete: isAdminOrGroupLeader,
    },
    hooks: {
      afterChange: [
        async ({ req, doc, previousDoc }) => {
          const { payload } = req
          const previousUsers = (previousDoc.users || []).map(u => typeof u === 'string' ? u : u.id)
          const currentUsers = (doc.users || []).map(u => typeof u === 'string' ? u : u.id)

          const newUsers = currentUsers.filter(u => !previousUsers.includes(u))

          if (newUsers.length > 0) {
            const groupCourses = (doc.courses || []).map(c => typeof c === 'string' ? c : c.id)

            if (groupCourses.length > 0) {
              for (const courseId of groupCourses) {
                const course = await payload.findByID({
                  collection: 'courses',
                  id: courseId,
                  depth: 0,
                })

                if (course) {
                  const existingStudents = (course.students || []).map(s => typeof s === 'string' ? s : s.id)
                  const allStudents = [...new Set([...existingStudents, ...newUsers])]

                  await payload.update({
                    collection: 'courses',
                    id: courseId,
                    data: {
                      students: allStudents,
                    },
                  })
                }
              }
            }
          }
        },
      ],
    },
    fields,
  }

  return { ...baseConfig }
}
