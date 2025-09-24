import { addDataAndFileToRequest, CollectionSlug, TypedCollection, type Endpoint } from 'payload'
import type { CourseProgress } from '../providers/types.js'

type Args = {
  userSlug: string
  courseSlug: string
}

type EnrollHandler = (args: Args) => Endpoint['handler']

export const enrollHandler: EnrollHandler = ({ userSlug = 'users', courseSlug = 'courses' }) => async (req) => {
  await addDataAndFileToRequest(req)
  const data = req.data
  const user = req.user
  const payload = req.payload
  const courseId = data?.courseId

  if (!user) {
    return Response.json({ message: 'You must be logged in to enroll.' }, { status: 401 })
  }

  if (!courseId) {
    return Response.json({ message: 'Course ID is required.' }, { status: 400 })
  }

  try {
    const currentUser = await payload.findByID({
      collection: userSlug as CollectionSlug,
      id: user.id,
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

    const enrolledCourseIds = (currentUser.enrolledCourses || []).map(
      (course: string | TypedCollection[typeof courseSlug]) => (typeof course === 'object' ? course.id : course),
    )

    const completedCourseIds = (currentUser.completedCourses || []).map(
      (course: string | TypedCollection[typeof courseSlug]) => (typeof course === 'object' ? course.id : course),
    )

    if (
      enrolledStudentIds?.includes(user.id) ||
      enrolledCourseIds.includes(courseId)
    ) {
      return Response.json({ message: 'You are already enrolled in this course.' }, { status: 409 })
    }

    if (
      completedCourseIds.includes(courseId) 
    ) {
      return Response.json({ message: 'You have already completed this course.' }, { status: 409 })
    }

    await payload.update({
      collection: courseSlug as CollectionSlug,
      id: courseId,
      data: {
        enrolledStudents: [...enrolledStudentIds, user.id],
      },
    })

    // Initialize course progress for the user
    const coursesProgress = currentUser.coursesProgress || []
    
    // Check if course progress already exists for this course
    const courseProgressExists = coursesProgress.some((progress: CourseProgress) => {
      if (typeof progress.course === 'object' && progress.course !== null) {
        return progress.course.id === courseId
      }
      return progress.course === courseId
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
        id: user.id,
        data: {
          coursesProgress: [...coursesProgress, newCourseProgress],
        },
      })
    }

    payload.logger.info(`User ${user.id} enrolled in course ${courseId}`)

    return Response.json({ success: true, message: 'Successfully enrolled in course.' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.'
    payload.logger.error(message)
    return Response.json({ message }, { status: 500 })
  }
}
