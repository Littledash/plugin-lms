import { addDataAndFileToRequest } from 'payload';
export const addCertificateToUserHandler = ({ userSlug = 'users', courseSlug = 'courses', certificatesSlug = 'certificates' })=>async (req)=>{
        await addDataAndFileToRequest(req);
        const data = req.data;
        const user = req.user;
        const payload = req.payload;
        const courseId = data?.courseId;
        const certificateId = data?.certificateId;
        const userId = data?.userId;
        if (!user) {
            return Response.json({
                message: 'You must be logged in to add a certificate.'
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
        if (!certificateId) {
            return Response.json({
                message: 'Certificate ID is required.'
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
            if (!currentUser) {
                return Response.json({
                    message: 'User not found.'
                }, {
                    status: 404
                });
            }
            // Fetch the certificate object
            const certificate = await payload.findByID({
                collection: certificatesSlug,
                id: certificateId
            });
            if (!certificate) {
                return Response.json({
                    message: 'Certificate not found.'
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
            const existingCertificates = (currentUser.certificates || []).map((cert)=>({
                    certificateId: typeof cert.certificate === 'object' ? cert.certificate.id : cert.certificate,
                    courseId: typeof cert.course === 'object' ? cert.course.id : cert.course
                }));
            const hasExistingCertificate = existingCertificates.some((cert)=>cert.certificateId === certificateId && cert.courseId === courseId);
            if (hasExistingCertificate) {
                return Response.json({
                    message: 'You already have this certificate.'
                }, {
                    status: 400
                });
            }
            await payload.update({
                collection: userSlug,
                id: currentUser.id,
                data: {
                    certificates: [
                        ...currentUser.certificates || [],
                        {
                            certificate: certificateId,
                            course: courseId,
                            completedDate: new Date().toISOString()
                        }
                    ]
                }
            });
            payload.logger.info(`Certificate added to user ${currentUser.id} for course ${courseId}`);
            return Response.json({
                success: true,
                message: 'Successfully added certificate to user.'
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

//# sourceMappingURL=add-certificate-to-user.js.map