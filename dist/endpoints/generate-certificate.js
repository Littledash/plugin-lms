import { addDataAndFileToRequest } from 'payload';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { CertificateDocument } from '../ui/Certificate/index.js';
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
        const certificateId = data?.certificateId;
        const userId = data?.userId;
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
                id: userId ? userId : user.id,
                depth: 1
            });
            const course = await payload.findByID({
                collection: courseSlug,
                id: courseId,
                depth: 1
            });
            if (!currentUser) {
                return Response.json({
                    message: 'User not found.'
                }, {
                    status: 404
                });
            }
            // Check if user has completed this course by looking at their completed courses
            const completedCourses = (Array.isArray(currentUser?.completedCourses) ? currentUser.completedCourses : []).map((course)=>typeof course === 'object' ? course.id : course);
            if (!completedCourses.includes(courseId)) {
                return Response.json({
                    message: 'You have not completed this course.'
                }, {
                    status: 403
                });
            }
            // Get certificate template from course awards
            const certificateTemplate = course?.awards?.certificate;
            if (!certificateTemplate) {
                return Response.json({
                    message: 'No certificate template configured for this course.'
                }, {
                    status: 404
                });
            }
            let certificatePDF = null;
            const certificateData = {
                studentName: currentUser.firstName + ' ' + currentUser.lastName,
                courseTitle: course.title,
                completionDate: new Date().toLocaleDateString(),
                certificateNumber: `CERT-${courseId}-${typeof certificateTemplate === 'object' ? certificateTemplate.id : certificateTemplate}-${currentUser.id}`,
                templateImage: typeof certificateTemplate === 'object' ? certificateTemplate.template?.url : null,
                fontFamily: 'Poppins',
                authorName: typeof certificateTemplate === 'object' ? certificateTemplate.authors?.[0]?.name : null
            };
            const pdfBuffer = await renderToBuffer(React.createElement(CertificateDocument, certificateData));
            const certificateFileName = `certificate-${courseId}-${typeof certificateTemplate === 'object' ? certificateTemplate.id : certificateTemplate}-${currentUser.id}.pdf`;
            const existingCertificate = await payload.find({
                collection: mediaSlug,
                where: {
                    filename: {
                        equals: certificateFileName
                    }
                }
            });
            if (existingCertificate.docs.length > 0) {
                certificatePDF = existingCertificate;
            } else {
                //   certificatePDF = await generateCertificatePDF(courseId, user.id)
                const certificateMedia = await payload.create({
                    collection: mediaSlug,
                    data: {
                        filename: certificateFileName,
                        title: 'Certificate - ' + course.title + ' - ' + currentUser.firstName + ' ' + currentUser.lastName,
                        mimeType: 'application/pdf',
                        filesize: pdfBuffer?.length
                    }
                });
                certificatePDF = certificateMedia;
            }
            payload.logger.info(`Generated certificate for user ${currentUser.id} for course ${courseId}`);
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