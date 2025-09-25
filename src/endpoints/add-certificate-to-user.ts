import { addDataAndFileToRequest, CollectionSlug, TypedCollection, type Endpoint } from 'payload'

type Args = {
  userSlug: string
  courseSlug: string
  certificatesSlug: string
}

type AddCertificateToUserHandler = (args: Args) => Endpoint['handler']

export const addCertificateToUserHandler: AddCertificateToUserHandler = ({ userSlug = 'users', courseSlug = 'courses', certificatesSlug = 'certificates' }) => async (req) => {
  await addDataAndFileToRequest(req)
  const data = req.data
  const user = req.user
  const payload = req.payload
  const courseId = data?.courseId
  const certificateId = data?.certificateId
  const userId = data?.userId

  if (!user) {
    return Response.json(
      { message: 'You must be logged in to add a certificate.' },
      { status: 401 },
    )
  }

  if (!courseId) {
    return Response.json({ message: 'Course ID is required.' }, { status: 400 })
  }

  if (!certificateId) {
    return Response.json({ message: 'Certificate ID is required.' }, { status: 400 })
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

    // Fetch the certificate object
    const certificate = await payload.findByID({
      collection: certificatesSlug as CollectionSlug,
      id: certificateId,
    })

    if (!certificate) {
      return Response.json({ message: 'Certificate not found.' }, { status: 404 })
    }

    const completedCourses = (currentUser.completedCourses || []).map((course: string | TypedCollection[typeof courseSlug]) =>
      typeof course === 'object' ? course.id : course,
    )

    if (!completedCourses.includes(courseId)) {
      return Response.json({ message: 'You have not completed this course.' }, { status: 403 })
    }

    const existingCertificates = (currentUser.certificates || []).map((cert: { certificate: string | TypedCollection[typeof certificatesSlug] }) => 
      typeof cert.certificate === 'object' ? cert.certificate.id : cert.certificate
    )

    if (existingCertificates.includes(certificateId)) {
      return Response.json({ message: 'You already have this certificate.' }, { status: 400 })
    }

    await payload.update({
      collection: userSlug as CollectionSlug,
      id: currentUser.id,
      data: {
        certificates: [
          ...(currentUser.certificates || []),
          {
            certificate: certificateId,
            completedDate: new Date().toISOString(),
          },
        ],
      },
    })

    

    payload.logger.info(`Certificate added to user ${currentUser.id} for course ${courseId}`)

    return Response.json({ success: true, message: 'Successfully added certificate to user.' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.'
    payload.logger.error(message)
    return Response.json({ message }, { status: 500 })
  }
}
