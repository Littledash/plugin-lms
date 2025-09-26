import { addDataAndFileToRequest, CollectionSlug, TypedCollection, type Endpoint } from 'payload'
import type { CourseProgress } from '../providers/types.js'

type Args = {
  userSlug?: string
  courseSlug?: string
  groupSlug?: string
}

type EnrollHandler = (args: Args) => Endpoint['handler']

export const enrollHandler: EnrollHandler = ({ userSlug = 'users', courseSlug = 'courses', groupSlug = 'groups' }) => async (req) => {
  await addDataAndFileToRequest(req)
  const data = req.data
  const user = req.user
  const payload = req.payload
  const courseId = data?.courseId
  const isGroup = data?.isGroup || false
  const companyName = data?.companyName || ''
  const userId = data?.userId || ''
  let isLeader = data?.isLeader || false

  if (!user) {
    return Response.json({ message: 'You must be logged in to enroll.' }, { status: 401 })
  }

  if (!courseId) {
    return Response.json({ message: 'Course ID is required.' }, { status: 400 })
  }

  try {
    const currentUser = await payload.findByID({
      collection: userSlug as CollectionSlug,
      id: userId ? userId : user.id,
      depth: 1,
    })

    const course = await payload.findByID({
      collection: courseSlug as CollectionSlug,
      id: courseId,
      depth: 1,
    })

    if (!currentUser) {
      return Response.json({ message: 'User not found.' }, { status: 404 })
    }

    const enrolledStudentIds = (course?.enrolledStudents || []).map((student: string | TypedCollection[typeof userSlug]) =>
      typeof student === 'object' ? student.id : student,
    )
    const enrolledGroupIds = (course?.enrolledGroups || []).map((group: string | TypedCollection[typeof groupSlug]) =>
      typeof group === 'object' ? group.id : group,
    )

    const enrolledCourseIds = (Array.isArray(currentUser.enrolledCourses) ? currentUser.enrolledCourses : []).map(
      (course: string | TypedCollection[typeof courseSlug]) => (typeof course === 'object' ? course.id : course),
    )

    const completedCourseIds = (Array.isArray(currentUser.completedCourses) ? currentUser.completedCourses : []).map(
      (course: string | TypedCollection[typeof courseSlug]) => (typeof course === 'object' ? course.id : course),
    )
    
    if (isGroup) {
      if (!companyName) {
        payload.logger.error('Company name is required for group enrollment.')
        return Response.json({ message: 'Company name is required for group enrollment.' }, { status: 400 })
      }

      let group: TypedCollection[typeof groupSlug] | null = null

      if (groupSlug) {
        const { docs: existingGroups }= await payload.find({
          collection: groupSlug as CollectionSlug,
          where: {
            title: {
              equals: companyName,
            },
          },
          depth: 1,
        })

        if (existingGroups.length > 0) {
          group = existingGroups[0] || null
          payload.logger.info(`Found existing group '${companyName}' with id ${group?.id}`)
         
          const currentLeaders = (group.leaders || []).map((leader: string | TypedCollection[typeof userSlug]) =>
            typeof leader === 'string' ? leader : leader.id,
          )
          const currentStudents = (group.students || []).map((student: string | TypedCollection[typeof userSlug]) =>
            typeof student === 'string' ? student : student.id,
          )

          const currentCourses = (group.courses || []).map((c: string | TypedCollection[typeof courseSlug]) =>
            typeof c === 'string' ? c : c.id,
          )

          const updatedData: Partial<TypedCollection[typeof groupSlug]> = {}

          if (isLeader && !currentLeaders.includes(user.id)) {
            updatedData.leaders = [...currentLeaders, user.id]
          }

          if (!isLeader && !currentStudents.includes(user.id)) {
            updatedData.students = [...currentStudents, user.id]
          }

          if (!currentCourses.includes(courseId)) {
            updatedData.courses = [...currentCourses, courseId]
          }

          if (Object.keys(updatedData).length > 0) {
            await payload.update({
              collection: 'groups',
              id: group.id,
              data: updatedData,
            })
            payload.logger.info(`Updated group ${group.id} with new student/course.`)
          } else {
            payload.logger.info(`Group ${group.id} already up-to-date.`)
          }
          

        } else {
          payload.logger.info(`No existing group found for '${companyName}'`)
          const newGroupData = {
            title: companyName,
            ...(isLeader ? { leaders: [user.id] } : { students: [user.id] }),
            courses: [courseId],
          }
          
          const newGroup = await payload.create({
            collection: 'groups',
            data: newGroupData,
          })
          group = newGroup
          payload.logger.info(`Created new group '${companyName}' with id ${group?.id}`)
        }

          // Add group to course's courseEnrolledGroups array
          const currentEnrolledGroups = (course.courseEnrolledGroups || []).map(
            (g: string | TypedCollection[typeof groupSlug]) => (typeof g === 'string' ? g : g.id),
          )

          if (!currentEnrolledGroups.includes(group.id)) {
            await payload.update({
              collection: courseSlug as CollectionSlug,
              id: courseId,
              data: {
                courseEnrolledGroups: [...currentEnrolledGroups, group.id],
              },
            })
            payload.logger.info(
              `Added group ${group.title} to course ${course.title}'s enrolled groups`,
            )
          } else {
            payload.logger.info(
              `Group ${group.title} is already enrolled in course ${course.title}`,
            )
          }
      
      }

    }
  
    // Initialize course progress for the user
    const coursesProgress = Array.isArray(currentUser.coursesProgress) ? currentUser.coursesProgress : []

        
    // Check if course progress already exists for this course
    const courseProgressExists = coursesProgress.some((progress: CourseProgress) => {
      if (typeof progress.course === 'object' && progress.course !== null) {
        return progress.course.id === courseId
      }
      return progress.course === courseId
    })


    if (
      enrolledStudentIds?.includes(user.id) ||
      enrolledCourseIds.includes(courseId)
    ) {
        
       if (!courseProgressExists) {
          // Create new course progress entry
          const newCourseProgress = {
            course: courseId,
            completed: false,
            completedLessons: [],
            completedQuizzes: [],
          }
          
          await payload.update({
            collection: userSlug as CollectionSlug,
            id: currentUser.id,
            data: {
              coursesProgress: [...coursesProgress, newCourseProgress],
            },
          })


          payload.logger.info(`User ${currentUser.id} course progress created for course ${courseId}`)
        }

      return Response.json({ message: 'You are already enrolled in this course.' }, { status: 200 })
    }

    if (
      completedCourseIds.includes(courseId) 
    ) {
      return Response.json({ message: 'You have already completed this course.' }, { status: 200 })
    }

    await payload.update({
      collection: courseSlug as CollectionSlug,
      id: courseId,
      data: {
        enrolledStudents: [...enrolledStudentIds, user.id],
      },
    })


    
    if (!courseProgressExists) {
      // Create new course progress entry
      const newCourseProgress = {
        course: courseId,
        completed: false,
        completedLessons: [],
        completedQuizzes: [],
      }
      
      await payload.update({
        collection: userSlug as CollectionSlug,
        id: currentUser.id,
        data: {
          coursesProgress: [...coursesProgress, newCourseProgress],
        },
      })
      payload.logger.info(`User ${currentUser.id} course progress created for course ${courseId}`)
    }

    payload.logger.info(`User ${currentUser.id} enrolled in course ${courseId}`)

    return Response.json({ success: true, message: 'Successfully enrolled in course.' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.'
    payload.logger.error(message)
    return Response.json({ message }, { status: 500 })
  }
}
