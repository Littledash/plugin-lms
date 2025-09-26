import { addDataAndFileToRequest, CollectionSlug, TypedCollection, type Endpoint } from 'payload'
import type { CourseProgress } from '../providers/types.js'
type Args = {
  userSlug: string
  courseSlug: string
  certificatesSlug: string
}

type CompleteCourseHandler = (args: Args) => Endpoint['handler']

export const completeCourseHandler: CompleteCourseHandler = ({ userSlug = 'users', courseSlug = 'courses', certificatesSlug = 'certificates'
}) => 
async (req) => {
  await addDataAndFileToRequest(req)
  const data = req.data
  const user = req.user
  const payload = req.payload
  const courseId = data?.courseId
  const userId = data?.userId || ''

  if (!user) {
    return Response.json(
      { message: 'You must be logged in to complete a course.' },
      { status: 401 },
    )
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

    if (!currentUser) {
      return Response.json({ message: 'User not found.' }, { status: 404 })
    }

    const course = await payload.findByID({
      collection: courseSlug as CollectionSlug,
      id: courseId,
      depth: 1,
    })

    // Check enrollment by looking at the course's enrolledStudents field (more reliable than join field)
    const enrolledStudentIds = (Array.isArray(course?.enrolledStudents) ? course.enrolledStudents : []).map((student: string | TypedCollection[typeof userSlug]) =>
      typeof student === 'object' ? student.id : student,
    )
    
    const completedCourses = (Array.isArray(currentUser.completedCourses) ? currentUser.completedCourses : []).map(
      (course: string | TypedCollection[typeof courseSlug]) => (typeof course === 'object' ? course.id : course),
    )

    if (!enrolledStudentIds.includes(currentUser.id)) {
      return Response.json({ message: 'You are not enrolled in this course.' }, { status: 409 })
    }

    if (completedCourses.includes(courseId)) {
      return Response.json({ message: 'You have already completed this course.' }, { status: 409 })
    }

    // Update course collection - add student to courseCompletedStudents and remove from enrolledStudents
    const courseCompletedStudents = (Array.isArray(course.courseCompletedStudents) ? course.courseCompletedStudents : []).map(
      (student: string | TypedCollection[typeof userSlug]) => (typeof student === 'object' ? student.id : student),
    )

    // Remove user from enrolledStudents and add to courseCompletedStudents
    const updatedEnrolledStudents = enrolledStudentIds.filter(id => id !== user.id)
    const updatedCompletedStudents = courseCompletedStudents.includes(user.id) 
      ? courseCompletedStudents 
      : [...courseCompletedStudents, user.id]

    await payload.update({
      collection: courseSlug as CollectionSlug,
      id: courseId,
      data: {
        enrolledStudents: updatedEnrolledStudents,
        courseCompletedStudents: updatedCompletedStudents,
      },
    })

    // Update user's course progress to mark as completed
    const coursesProgress = currentUser.coursesProgress || []
    const courseProgressIndex = coursesProgress.findIndex((progress: CourseProgress) => {
      if (typeof progress.course === 'object' && progress.course !== null) {
        return progress.course.id === courseId
      }
      return progress.course === courseId
    })

    if (courseProgressIndex !== -1) {
      // Update existing progress to mark as completed
      coursesProgress[courseProgressIndex] = {
        ...coursesProgress[courseProgressIndex],
        completed: true,
        completedAt: new Date().toISOString(),
      }
    } else {
      // Create new progress entry if it doesn't exist (shouldn't happen with enrollment initialization)
      coursesProgress.push({
        course: courseId,
        completed: true,
        completedAt: new Date().toISOString(),
        completedLessons: [],
        completedQuizzes: [],
      })
    }

    await payload.update({
      collection: userSlug as CollectionSlug,
      id: currentUser.id,
      data: {
        coursesProgress,
      },
    })

    // Add certificate to user if the course has one
    try {
      // Check if the course has a certificate configured
      if (course.awards?.certificate) {
        const certificateId = typeof course.awards.certificate === 'object' 
          ? course.awards.certificate.id 
          : course.awards.certificate


          const existingCertificates = (Array.isArray(currentUser.certificates) ? currentUser.certificates : []).map((cert: { certificate: string | TypedCollection[typeof certificatesSlug], course: string | TypedCollection[typeof courseSlug] }) => ({
            certificateId: typeof cert.certificate === 'object' ? cert.certificate.id : cert.certificate,
            courseId: typeof cert.course === 'object' ? cert.course.id : cert.course
          }))

        const hasExistingCertificate = existingCertificates.some((cert: { certificateId: string | number, courseId: string | number }) => 
          cert.certificateId === certificateId && cert.courseId === courseId
        )

        if (hasExistingCertificate) {
          
          return Response.json({ message: 'You already have this certificate.' }, { status: 200 })
        }

        await payload.update({
          collection: userSlug as CollectionSlug,
          id: currentUser.id,
          data: {
            certificates: [
              ...(currentUser.certificates || []),
              {
                certificate: certificateId,
                course: courseId,
                completedDate: new Date().toISOString(),
              },
            ],
          },
        })
        
        payload.logger.info(`Certificate ${certificateId} added to user ${user.id} for completing course ${courseId}`)
      } else {
        payload.logger.info(`Course ${courseId} does not have a certificate configured`)
      }
    } catch (error: unknown) {
      payload.logger.error(`Failed to add certificate to user: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`)
      // Don't fail the entire course completion if certificate addition fails
    }
      

    payload.logger.info(`User ${user.id} completed course ${courseId}`)

    return Response.json({ success: true, message: 'Successfully completed course.' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.'
    payload.logger.error(message)
    return Response.json({ message }, { status: 500 })
  }
}
