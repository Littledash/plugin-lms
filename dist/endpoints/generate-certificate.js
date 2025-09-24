import { addDataAndFileToRequest } from 'payload';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { CertificateDocument } from '../ui/Certificate/index.jsx';
async function renderToBuffer(doc) {
    const stream = await renderToStream(doc);
    const chunks = [];
    for await (const chunk of stream){
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}
export const generateCertificateHandler = ({ userSlug = 'users', courseSlug = 'courses', mediaSlug = 'media' })=>async (req)=>{
        await addDataAndFileToRequest(req);
        const data = req.data;
        const user = req.user;
        const payload = req.payload;
        const courseId = data?.courseId;
        const certificate = data?.certificate;
        if (!user) {
            return Response.json({
                message: 'You must be logged in to generate a certificate.'
            }, {
                status: 401
            });
        }
        if (!courseId) {
            return Response.json({
                message: 'Course ID is required.'
            }, {
                status: 400
            });
        }
        try {
            const currentUser = await payload.findByID({
                collection: userSlug,
                id: user.id,
                depth: 1
            });
            if (!currentUser) {
                return Response.json({
                    message: 'User not found.'
                }, {
                    status: 404
                });
            }
            const completedCourses = (currentUser.completedCourses || []).map((course)=>typeof course === 'object' ? course.id : course);
            if (!completedCourses.includes(courseId)) {
                return Response.json({
                    message: 'You have not completed this course.'
                }, {
                    status: 403
                });
            }
            let certificatePDF = null;
            const certificateData = {
                studentName: currentUser.firstName + ' ' + currentUser.lastName,
                courseTitle: certificate.title,
                completionDate: new Date().toLocaleDateString(),
                certificateNumber: `CERT-${courseId}-${certificate.id}-${user.id}`,
                templateImage: certificate.template?.url,
                fontFamily: 'Poppins',
                authorName: certificate.authors?.[0]?.name
            };
            const pdfBuffer = await renderToBuffer(React.createElement(CertificateDocument, certificateData));
            const certificateFileName = `Certificate-${courseId}-${certificate.id}-${user.id}.pdf`;
            const existingCertificate = await payload.find({
                collection: mediaSlug,
                where: {
                    filename: {
                        equals: certificateFileName
                    }
                }
            });
            if (existingCertificate.docs.length > 0) {
                certificatePDF = existingCertificate.docs[0].url;
            } else {
                //   certificatePDF = await generateCertificatePDF(courseId, user.id)
                const certificateMedia = await payload.create({
                    collection: mediaSlug,
                    data: {
                        filename: certificateFileName,
                        title: 'Certificate - ' + certificate.title + ' - ' + currentUser.firstName + ' ' + currentUser.lastName + ' - ' + courseId,
                        mimeType: 'application/pdf',
                        filesize: pdfBuffer?.length
                    }
                });
                certificatePDF = certificateMedia.docs[0].url;
            }
            // const certificatePDF = await generateCertificatePDF(courseId, user.id)
            payload.logger.info(`Generated certificate for user ${user.id} for course ${courseId}`);
            return Response.json({
                success: true,
                message: 'Successfully generated certificate.',
                certificate: certificatePDF
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            payload.logger.error(message);
            return Response.json({
                message
            }, {
                status: 500
            });
        }
    };

//# sourceMappingURL=generate-certificate.js.map