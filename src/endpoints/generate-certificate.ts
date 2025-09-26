import { addDataAndFileToRequest, CollectionSlug, type Endpoint } from 'payload'
import { renderToStream, type DocumentProps } from '@react-pdf/renderer'
import React from 'react'
import { CertificateDocument } from '../ui/Certificate/index.js'

type Args = {
  userSlug: string
  courseSlug: string
  mediaSlug: string
  certificatesSlug: string
}

async function renderToBuffer(doc: React.ReactElement<DocumentProps>) {
  const stream = await renderToStream(doc)
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks)
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

    if (!currentUser) {
      return Response.json({ message: 'User not found.' }, { status: 404 })
    }

    let certificatePDF = null

  
    const certificateData = {
      studentName: currentUser.firstName + ' ' + currentUser.lastName,
      courseTitle: course.title, // should be the course title
      completionDate: new Date().toLocaleDateString(),
      certificateNumber: `CERT-${courseId}-${certificate.id}-${currentUser.id}`,
      templateImage: certificate.template?.url, // A4 landscape
      fontFamily: 'Poppins',
      authorName: certificate.authors?.[0]?.firstName + ' ' + certificate.authors?.[0]?.lastName
  }

  payload.logger.info(`Generating certificate for user ${currentUser.id} for course ${courseId}`)
  payload.logger.info(`Certificate data:`, JSON.stringify(certificateData, null, 2));
  const pdfBuffer = await renderToBuffer(React.createElement(CertificateDocument, certificateData) as React.ReactElement<DocumentProps>);
  payload.logger.info(`PDF buffer:`, pdfBuffer);
  payload.logger.info(`Generated certificate for user ${currentUser.id} for course ${courseId}`)

  
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
  //   certificatePDF = await generateCertificatePDF(courseId, user.id)
   const certificateMedia = await payload.create({
      collection: mediaSlug as CollectionSlug,
      data: {
        filename: certificateFileName,
        title: 'Certificate - ' + course.title + ' - ' + currentUser.firstName + ' ' + currentUser.lastName,
        mimeType: 'application/pdf',
        filesize:  pdfBuffer?.length,
      }
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