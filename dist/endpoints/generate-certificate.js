import { addDataAndFileToRequest } from 'payload';
export const generateCertificateHandler = ({ userSlug = 'users', courseSlug = 'courses', certificatesSlug = 'certificates' })=>async (req)=>{
        await addDataAndFileToRequest(req);
        const data = req.data;
        const user = req.user;
        const payload = req.payload;
        const courseId = data?.courseId;
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
            const newCertificate = await payload.create({
                collection: certificatesSlug,
                data: {
                    user: user.id,
                    course: courseId,
                    issuedAt: new Date().toISOString()
                }
            });
            payload.logger.info(`Generated certificate for user ${user.id} for course ${courseId}`);
            return Response.json(newCertificate);
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