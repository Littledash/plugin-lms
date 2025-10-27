import { slugField } from '../fields/slug.js';
export const groupsCollection = (props)=>{
    const { overrides, coursesCollectionSlug = 'courses', usersCollectionSlug = 'users', couponsCollectionSlug = 'coupons' } = props || {};
    const fieldsOverride = overrides?.fields;
    const defaultFields = [
        {
            name: 'title',
            type: 'text',
            required: true
        },
        {
            name: 'description',
            type: 'richText'
        },
        ...slugField(),
        {
            name: 'purchasedCourses',
            type: 'array',
            fields: [
                {
                    name: 'seatManagement',
                    type: 'group',
                    required: true,
                    fields: [
                        {
                            name: 'seatsTotal',
                            type: 'number',
                            required: true,
                            defaultValue: 1,
                            admin: {
                                description: 'Total seats purchased for this group'
                            }
                        },
                        {
                            name: 'seatsUsed',
                            type: 'number',
                            defaultValue: 0,
                            admin: {
                                readOnly: true
                            }
                        },
                        {
                            name: 'course',
                            type: 'relationship',
                            relationTo: coursesCollectionSlug,
                            hasMany: false,
                            admin: {
                                description: 'The course that is associated with the group'
                            }
                        },
                        {
                            name: 'coupon',
                            type: 'relationship',
                            relationTo: couponsCollectionSlug,
                            admin: {
                                description: 'The coupon that is associated with the group'
                            }
                        }
                    ]
                }
            ]
        },
        {
            name: 'students',
            type: 'relationship',
            relationTo: usersCollectionSlug,
            hasMany: true,
            admin: {
                position: 'sidebar',
                description: 'The users that are part of the group',
                allowCreate: false,
                allowEdit: false
            }
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
                allowEdit: false
            }
        }
    ];
    const fields = fieldsOverride && typeof fieldsOverride === 'function' ? fieldsOverride({
        defaultFields
    }) : defaultFields;
    const baseConfig = {
        slug: 'groups',
        admin: {
            useAsTitle: 'title',
            // group: 'LMS',
            ...overrides?.admin
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
        fields
    };
    return {
        ...baseConfig
    };
};

//# sourceMappingURL=groupsCollection.js.map