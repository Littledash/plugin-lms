import { addDataAndFileToRequest } from 'payload';
export const enrollHandler = ({ userSlug = 'users', courseSlug = 'courses' })=>async (req)=>{
        await addDataAndFileToRequest(req);
        const data = req.data;
        const user = req.user;
        const payload = req.payload;
        const courseId = data?.courseId;
        if (!user) {
            return Response.json({
                message: 'You must be logged in to enroll.'
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
            const enrolledStudentIds = (course?.students || []).map((student)=>typeof student === 'object' ? student.id : student);
            const enrolledCourseIds = (currentUser.enrolledCourses?.docs || []).map((course)=>typeof course === 'object' ? course.id : course);
            const completedCourseIds = (currentUser.completedCourses?.docs || []).map((course)=>typeof course === 'object' ? course.id : course);
            if (enrolledStudentIds?.includes(user.id) || enrolledCourseIds.includes(courseId)) {
                return Response.json({
                    message: 'You are already enrolled in this course.'
                }, {
                    status: 409
                });
            }
            if (completedCourseIds.includes(courseId)) {
                return Response.json({
                    message: 'You are already completed this course.'
                }, {
                    status: 409
                });
            }
            await payload.update({
                collection: courseSlug,
                id: courseId,
                data: {
                    enrolledStudents: [
                        ...enrolledStudentIds,
                        user.id
                    ]
                }
            });
            payload.logger.info(`User ${user.id} enrolled in course ${courseId}`);
            return Response.json({
                success: true,
                message: 'Successfully enrolled in course.'
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

//# sourceMappingURL=enroll.js.map