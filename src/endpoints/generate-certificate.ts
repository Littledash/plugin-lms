import { addDataAndFileToRequest, CollectionSlug, type Endpoint } from 'payload'
import { createPDF } from '../utilities/createPDF.js'

type Args = {
  userSlug: string
  courseSlug: string
  mediaSlug: string
  certificatesSlug: string
}

type GenerateCertificateHandler = (args: Args) => Endpoint['handler']

export const generateCertificateHandler: GenerateCertificateHandler = ({ userSlug = 'users', courseSlug = 'courses', mediaSlug = 'media', certificatesSlug = 'certificates' }) => async (req) => {
  await addDataAndFileToRequest(req)
  const data = req.data
  const user = req.user
  const payload = req.payload
  const courseId = data?.courseId
  const certificateId = data?.certificateId
  const userId = data?.userId

  if (!user) {
    return Response.json(
      { message: 'You must be logged in to generate a certificate.' },
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

    const course = await payload.findByID({
      collection: courseSlug as CollectionSlug,
      id: courseId,
      depth: 1,
    })

    const certificate = await payload.findByID({
      collection: certificatesSlug as CollectionSlug,
      id: certificateId,
      depth: 1,
    })

    if ( !course ) {
      return Response.json({ message: 'Course not found.' }, { status: 404 })
    }

    if ( !certificate ) {
      return Response.json({ message: 'Certificate not found.' }, { status: 404 })
    }

    if (!currentUser) {
      return Response.json({ message: 'User not found.' }, { status: 404 })
    }

    let certificatePDF = null


    //
    //
    payload.logger.info(`Course:`, JSON.stringify(course, null, 2));
    payload.logger.info(`Certificate:`, JSON.stringify(certificate, null, 2));
    payload.logger.info(`Current user:`, JSON.stringify(currentUser, null, 2));
  
    // Validate required data
    if (!currentUser.firstName || !currentUser.lastName) {
      return Response.json({ message: 'User name is incomplete.' }, { status: 400 })
    }
    
    if (!course.title) {
      return Response.json({ message: 'Course title is missing.' }, { status: 400 })
    }

    const certificateData = {
      studentName: `${currentUser.firstName} ${currentUser.lastName}`,
      courseTitle: course.title,
      completionDate: new Date().toLocaleDateString(),
      certificateNumber: `CERT-${courseId}-${certificate.id}-${currentUser.id}`,
      templateImage: certificate.template?.url || '', // Provide empty string as fallback
      fontFamily: 'Poppins',
      authorName: certificate.authors && certificate.authors.length > 0 
        ? `${certificate.authors[0]?.firstName || ''} ${certificate.authors[0]?.lastName || ''}`.trim()
        : undefined
    }



  
  const certificateFileName = `certificate-${courseId}-${certificate.id}-${currentUser.id}.pdf`;
  
  const existingCertificate = await payload.find({
    collection: mediaSlug as CollectionSlug,
    where: {
      filename: {
        equals: certificateFileName
      }
    }
  })
  payload.logger.info(`Existing certificate:`, JSON.stringify(existingCertificate, null, 2));

  if (existingCertificate.docs.length > 0) {
    payload.logger.info(`Certificate already exists for user ${currentUser.id} for course ${courseId}`)
    certificatePDF = existingCertificate
  } else {
    payload.logger.info(`Creating new certificate for user ${currentUser.id} for course ${courseId}`)
    payload.logger.info(`Generating certificate for user ${currentUser.id} for course ${courseId}`)
    payload.logger.info(`Certificate data:`, JSON.stringify(certificateData, null, 2));
  
    payload.logger.info(`Creating PDF for user ${currentUser.id} for course ${courseId}`)
    payload.logger.info(`About to call createPDF with certificate data:`, JSON.stringify(certificateData, null, 2))
    
    let createPDFRes
    try {
      payload.logger.info(`Calling createPDF function...`)
      createPDFRes = await createPDF(certificateData)
      payload.logger.info(`PDF created successfully for user ${currentUser.id} for course ${courseId}`)
    } catch (pdfError) {
      payload.logger.error(`Failed to create PDF for user ${currentUser.id} for course ${courseId}`)
      payload.logger.error(`PDF Error type:`, typeof pdfError)
      payload.logger.error(`PDF Error details:`, pdfError)
      payload.logger.error(`PDF Error stack:`, pdfError instanceof Error ? pdfError.stack : 'No stack trace available')
      payload.logger.error(`PDF Error message:`, pdfError instanceof Error ? pdfError.message : String(pdfError))
      payload.logger.error(`PDF Error name:`, pdfError instanceof Error ? pdfError.name : 'Not an Error object')
      
      // Try to stringify the error for more details
      try {
        payload.logger.error(`PDF Error JSON:`, JSON.stringify(pdfError, null, 2))
      } catch (stringifyError) {
        payload.logger.error(`Could not stringify error:`, stringifyError)
      }
      
      return Response.json({ 
        message: 'Failed to generate certificate PDF.', 
        error: pdfError instanceof Error ? pdfError.message : String(pdfError),
        details: pdfError 
      }, { status: 500 })
    }

    payload.logger.info(`Generated certificate for user ${currentUser.id} for course ${courseId}`)
    
    // Convert Uint8Array to Blob - use type assertion to handle ArrayBufferLike issue
    const pdfBlob = new Blob([createPDFRes as any], { type: 'application/pdf' })
    
    const pdfFormData = new FormData()
    pdfFormData.append('file', pdfBlob, certificateFileName)
    pdfFormData.append('_payload', 
      JSON.stringify({
        title: 'Certificate - ' + course.title + ' - ' + currentUser.firstName + ' ' + currentUser.lastName,
        mimeType: 'application/pdf',
      })
    )

  const certificateMedia = await payload.create({
      collection: mediaSlug as CollectionSlug,
        data: pdfFormData
    })
    
    payload.logger.info(`Created new certificate for user ${currentUser.id} for course ${courseId}`)
    certificatePDF = certificateMedia
    payload.logger.info(`Set certificatePDF to ${certificatePDF.id}`)
  }
    

    payload.logger.info(`Generated certificate for user ${currentUser.id} for course ${courseId}`)

    return Response.json({ success: true, message: 'Successfully generated certificate.', certificate: certificatePDF })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.'
    payload.logger.error(message)
    return Response.json({ message }, { status: 500 })
  }
}