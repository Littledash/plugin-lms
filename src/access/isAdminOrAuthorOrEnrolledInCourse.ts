import type { Access, FieldAccess } from 'payload'

import { checkRole } from './checkRole.js'

/**
 * Access control that allows users with admin role or author role or enrolled in course
 * @returns True if the user is an admin or author or enrolled in course, false otherwise
 */
export const isAdminOrAuthorOrEnrolledInCourse: Access = async ({
  req: { user, payload },
  data,
}) => {
  if (user && checkRole(['admin', 'author'], user)) {
    return true
  }

  if (user && checkRole(['student'], user) && data?.course) {
    const courseId = typeof data.course === 'string' ? data.course : data.course.id

    const courses = await payload.find({
      collection: 'courses',
      where: {
        id: {
          equals: courseId,
        },
      or: [
        {
          enrolledStudents: {
            contains: user.id,
          },
        },
        {
          courseCompletedStudents: {
            contains: user.id,
          },
        },
        {
          courseEnrolledGroups: {
            contains: {
              leaders: {
                contains: user.id,
              },
            },
          },
        },
        {
          courseEnrolledGroups: {
            contains: {
              students: {
                contains: user.id,
              },
            },
          },
        }
      ],
      },
    })

    return courses.docs.length > 0
  }
  return false
}

export const isAdminOrAuthorOrEnrolledInCourseFieldLevel: FieldAccess = async ({
  req: { user, payload },
  doc,
}) => {
  if (!user) return false

  if (checkRole(['admin', 'author'], user)) return true

  // Check if user is enrolled in the course. Not sure if this is the best way to do this. Or if it works with the current setup.
  const courses = await payload.find({
    collection: 'courses',
    where: {
      id: {
        equals: doc?.course,
      },
      or: [
        {
          enrolledUsers: {
            contains: user.id,
          },
        },
        {
          courseCompletedStudents: {
            contains: user.id,
          },
        },
        {
          courseEnrolledGroups: {
            contains: {
              leaders: {
                contains: user.id,
              },
            },
          },
        },
        {
          courseEnrolledGroups: {
            contains: {
              students: {
                contains: user.id,
              },
            },
          },
        },
      ],
    },
  })

  const isEnrolled = courses.docs.length > 0

  return isEnrolled
}
