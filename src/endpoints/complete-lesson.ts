import { addDataAndFileToRequest, CollectionSlug, type Endpoint } from 'payload'

type Args = {
  userSlug: string
}

type CompleteLessonHandler = (args: Args) => Endpoint['handler']

export const completeLessonHandler: CompleteLessonHandler = ({ userSlug = 'users'}) => 
  async (req) => {

  await addDataAndFileToRequest(req)
  const data = req.data
  const user = req.user
  const payload = req.payload
  const courseId = data?.courseId
  const lessonId = data?.lessonId

  if (!user) {
    return Response.json(
      { message: 'You must be logged in to complete a lesson.' },
      { status: 401 },
    )
  }

  if (!courseId || !lessonId) {
    return Response.json({ message: 'Course ID and Lesson ID are required.' }, { status: 400 })
  }

  try {
    const currentUser = await payload.findByID({
      collection: userSlug as CollectionSlug,
      id: user.id,
      depth: 1,
    })

    if (!currentUser) {
      return Response.json({ message: 'User not found.' }, { status: 404 })
    }

    const coursesProgress = currentUser.coursesProgress || []
    let courseProgressIndex = coursesProgress.findIndex((cp: any) => cp.course === courseId)
    
    if (courseProgressIndex === -1) {
      // Create new course progress entry
      coursesProgress.push({
        course: courseId,
        completed: false,
        completedLessons: [],
        completedQuizzes: [],
      })
      courseProgressIndex = coursesProgress.length - 1
    }
    
    const courseProgress = coursesProgress[courseProgressIndex]
    const lessonExists = courseProgress.completedLessons.some((cl: any) => cl.lesson === lessonId)
    
    if (!lessonExists) {
      courseProgress.completedLessons.push({
        lesson: lessonId,
        completedAt: new Date().toISOString(),
      })
    }

    await payload.update({
      collection: userSlug as CollectionSlug,
      id: user.id,
      data: {
        coursesProgress,
      },
    })

    payload.logger.info(`User ${user.id} completed lesson ${lessonId} in course ${courseId}`)

    return Response.json({ success: true, message: 'Successfully completed lesson.' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.'
    payload.logger.error(message)
    return Response.json({ message }, { status: 500 })
  }
}
