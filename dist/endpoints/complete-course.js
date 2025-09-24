import { addDataAndFileToRequest } from 'payload';
export const completeCourseHandler = ({ userSlug = 'users', courseSlug = 'courses' })=>async (req)=>{
        await addDataAndFileToRequest(req);
        const data = req.data;
        const user = req.user;
        const payload = req.payload;
        const courseId = data?.courseId;
        if (!user) {
            return Response.json({
                message: 'You must be logged in to complete a course.'
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
            const course = await payload.findByID({
                collection: courseSlug,
                id: courseId,
                depth: 1
            });
            const enrolledCourses = (currentUser.enrolledCourses || []).map((course)=>typeof course === 'object' ? course.id : course);
            const completedCourses = (currentUser.completedCourses || []).map((course)=>typeof course === 'object' ? course.id : course);
            if (!enrolledCourses.includes(courseId)) {
                return Response.json({
                    message: 'You are not enrolled in this course.'
                }, {
                    status: 409
                });
            }
            if (completedCourses.includes(courseId)) {
                return Response.json({
                    message: 'You have already completed this course.'
                }, {
                    status: 409
                });
            }
            // Update course collection - add student to courseCompletedStudents while keeping them enrolled
            const courseCompletedStudents = (course.courseCompletedStudents || []).map((student)=>typeof student === 'object' ? student.id : student);
            // Only add to completed students if not already there
            if (!courseCompletedStudents.includes(user.id)) {
                await payload.update({
                    collection: courseSlug,
                    id: courseId,
                    data: {
                        courseCompletedStudents: [
                            ...courseCompletedStudents,
                            user.id
                        ]
                    }
                });
            }
            // Update user's course progress to mark as completed
            const coursesProgress = currentUser.coursesProgress || [];
            const courseProgressIndex = coursesProgress.findIndex((progress)=>{
                if (typeof progress.course === 'object' && progress.course !== null) {
                    return progress.course.id === courseId;
                }
                return progress.course === courseId;
            });
            if (courseProgressIndex !== -1) {
                // Update existing progress to mark as completed
                coursesProgress[courseProgressIndex] = {
                    ...coursesProgress[courseProgressIndex],
                    completed: true,
                    completedAt: new Date().toISOString()
                };
            } else {
                // Create new progress entry if it doesn't exist (shouldn't happen with enrollment initialization)
                coursesProgress.push({
                    course: courseId,
                    completed: true,
                    completedAt: new Date().toISOString(),
                    completedLessons: [],
                    completedQuizzes: []
                });
            }
            await payload.update({
                collection: userSlug,
                id: user.id,
                data: {
                    coursesProgress
                }
            });
            payload.logger.info(`User ${user.id} completed course ${courseId}`);
            return Response.json({
                success: true,
                message: 'Successfully completed course.'
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

//# sourceMappingURL=complete-course.js.map