import { CollectionConfig } from 'payload'
import { slugField } from '../fields/slug.js'
import { isAdminOrGroupLeader } from '../access/isAdminOrGroupLeader.js'
import { isMemberOfGroup } from '../access/isMemberOfGroup.js'
import { FieldsOverride } from '../types.js'

type Props = {
  // coursesCollectionSlug?: string
  usersCollectionSlug?: string
  // certificatesCollectionSlug?: string
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}

export const groupsCollection: (props?: Props) => CollectionConfig = (props) => {
  const {
    overrides,
    // coursesCollectionSlug = 'courses',
    usersCollectionSlug = 'users',
    // certificatesCollectionSlug = 'certificates',
  } = props || {}

  const fieldsOverride = overrides?.fields

  const defaultFields: CollectionConfig['fields'] = [
    {
      name: 'title',
      type: 'text',
      required: true,
    },

    {
      name: 'description',
      type: 'richText',
    },
    ...slugField(),
    // {
    //   name: 'courses',
    //   type: 'relationship',
    //   relationTo: coursesCollectionSlug,
    //   hasMany: true,
    //   admin: {
    //     position: 'sidebar',
    //     description: 'The courses that are part of the group',
    //     allowCreate: false,
    //     allowEdit: false,
    //   },
    // },
    {
      name: 'students',
      type: 'relationship',
      relationTo: usersCollectionSlug,
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'The users that are part of the group',
        allowCreate: false,
        allowEdit: false,
      },
    },
 
    {
      name: 'leaders',
      type: 'relationship',
      relationTo: usersCollectionSlug,
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'The leaders of the group',
        allowCreate: false,
        allowEdit: false,
      },
      // filterOptions: ({ user }) => {
      //   if (user && user.roles.includes('admin')) {
      //     return {}
      //   }
      //   return {
      //     roles: {
      //       contains: ['instructor', 'leader'],
      //     },
      //   }
      // },
    },
    // {
    //   name: 'accessMode',
    //   type: 'select',
    //   options: [
    //     { label: 'Free', value: 'free' },
    //     { label: 'Buy Now', value: 'buy_now' },
    //     { label: 'Recurring', value: 'recurring' },
    //     { label: 'Closed', value: 'closed' },
    //   ],
    //   defaultValue: 'free',
    //   admin: {
    //     description: 'The access mode of the group',
    //   },
    // },
    // {
    //   name: 'price',
    //   type: 'number',
    //   required: true,
    //   admin: {
    //     condition: (_, siblingData) =>
    //       siblingData.accessMode === 'buy_now' || siblingData.accessMode === 'recurring',
    //   },
    // },
    // {
    //   name: 'billingCycle',
    //   type: 'group',
    //   admin: {
    //     condition: (_, siblingData) => siblingData.accessMode === 'recurring',
    //   },
    //   fields: [
    //     {
    //       name: 'interval',
    //       type: 'select',
    //       options: [
    //         { label: 'Day', value: 'day' },
    //         { label: 'Week', value: 'week' },
    //         { label: 'Month', value: 'month' },
    //         { label: 'Year', value: 'year' },
    //       ],
    //       required: true,
    //     },
    //     {
    //       name: 'frequency',
    //       type: 'number',
    //       required: true,
    //     },
    //   ],
    // },
    // {
    //   type: 'row',
    //   fields: [
    //     {
    //       name: 'startDate',
    //       type: 'date',
    //       admin: {
    //         date: {
    //           pickerAppearance: 'dayOnly',
    //         },
    //         description: 'The start date of the group',
    //         width: '50%',
    //       },
    
    //     },
    //     {
    //       name: 'endDate',
    //       type: 'date',
    //       admin: {
    //         date: {
    //           pickerAppearance: 'dayOnly',
    //         },
    //         description: 'The end date of the group',
    //         width: '50%',
    //       },
    //     },
    //   ],
    // },
    {
      name: 'studentLimit',
      type: 'number',
    },
    // {
    //   name: 'materials',
    //   type: 'richText',
    // },
    // {
    //   name: 'certificate',
    //   type: 'relationship',
    //   relationTo: certificatesCollectionSlug,
    //   admin: {
    //     allowCreate: false,
    //     description: 'The certificate that is awarded to the students who complete the group',
    //   },
    // },
    // {
    //   name: 'contentVisibility',
    //   type: 'select',
    //   options: [
    //     { label: 'Always visible', value: 'always' },
    //     { label: 'Only visible to enrollees', value: 'enrolled' },
    //   ],
    //   defaultValue: 'always',
    // },
    // {
    //   name: 'customPagination',
    //   type: 'number',
    //   defaultValue: 20,
    // },
    // {
    //   name: 'order',
    //   type: 'select',
    //   options: [
    //     { label: 'Date Ascending', value: 'date_asc' },
    //     { label: 'Date Descending', value: 'date_desc' },
    //     { label: 'Title Ascending', value: 'title_asc' },
    //     { label: 'Title Descending', value: 'title_desc' },
    //   ],
    //   defaultValue: 'date_desc',
    // },
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
    // hooks: {
    //   afterChange: [
    //     async ({ req, doc, previousDoc }) => {
    //       const { payload } = req
    //       const previousUsers = (previousDoc.users || []).map((user) => typeof user === 'string' ? user : user.id)
    //       const currentUsers = (doc.users || []).map(user => typeof user === 'string' ? user : user.id)

    //       const newUsers = currentUsers.filter(user => !previousUsers.includes(user))

    //       if (newUsers.length > 0) {
    //         const groupCourses = (doc.courses || []).map(course => typeof course === 'string' ? course : course.id)

    //         if (groupCourses.length > 0) {
    //           for (const courseId of groupCourses) {
    //             const course = await payload.findByID({
    //               collection: 'courses',
    //               id: courseId,
    //               depth: 0,
    //             })

    //             if (course) {
    //               const existingStudents = (course.students || []).map(student => typeof student === 'string' ? student : student.id)
    //               const allStudents = [...new Set([...existingStudents, ...newUsers])]

    //               await payload.update({
    //                 collection: 'courses',
    //                 id: courseId,
    //                 data: {
    //                   students: allStudents,
    //                 },
    //               })
    //             }
    //           }
    //         }
    //       }
    //     },
    //   ],
    // },
    fields,
  }

  return { ...baseConfig }
}
