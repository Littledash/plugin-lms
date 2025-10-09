import { addDataAndFileToRequest } from 'payload';
export const completeLessonHandler = ({ userSlug = 'users' })=>async (req)=>{
        await addDataAndFileToRequest(req);
        const data = req.data;
        const user = req.user;
        const payload = req.payload;
        const courseId = data?.courseId;
        const lessonId = data?.lessonId;
        if (!user) {
            return Response.json({
                message: 'You must be logged in to complete a lesson.'
            }, {
                status: 401
            });
        }
        if (!courseId || !lessonId) {
            return Response.json({
                message: 'Course ID and Lesson ID are required.'
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
            const coursesProgress = currentUser.coursesProgress || [];
            // Check if course progress already exists for this course
            let courseProgressIndex = coursesProgress.findIndex((c)=>{
                // Handle both full course objects and course IDs for backward compatibility
                if (typeof c.course === 'object' && c.course !== null) {
                    return c.course.id === courseId;
                }
                return c.course === courseId;
            });
            if (courseProgressIndex === -1) {
                // Create new course progress entry if it doesn't exist
                const newCourseProgress = {
                    course: courseId,
                    completed: false,
                    completedLessons: [],
                    completedQuizzes: []
                };
                coursesProgress.push(newCourseProgress);
                courseProgressIndex = coursesProgress.length - 1;
            }
            const courseProgress = coursesProgress[courseProgressIndex];
            // Check if lesson is already completed
            const lessonExists = courseProgress.completedLessons.some((cl)=>{
                // Handle both full lesson objects and lesson IDs for backward compatibility
                if (typeof cl.lesson === 'object' && cl.lesson !== null) {
                    return cl.lesson.id === lessonId;
                }
                return cl.lesson === lessonId;
            });
            if (!lessonExists) {
                // Add the completed lesson
                courseProgress.completedLessons.push({
                    lesson: lessonId,
                    completedAt: new Date().toISOString()
                });
            }
            // Check if all lessons in the course are completed
            try {
                const course = await payload.findByID({
                    collection: 'courses',
                    id: courseId,
                    depth: 1
                });
                if (course && course.lessons) {
                    // Count total required lessons (non-optional)
                    const totalRequiredLessons = course.lessons.filter((lessonItem)=>!lessonItem.isOptional);
                    // Get completed lesson IDs
                    const completedLessonIds = courseProgress.completedLessons.map((lesson)=>typeof lesson.lesson === 'object' && lesson.lesson !== null ? lesson.lesson.id : lesson.lesson);
                    // Check if all required lessons are completed
                    const allRequiredLessonsCompleted = totalRequiredLessons.every((lessonItem)=>{
                        const lessonId = typeof lessonItem.lesson === 'object' && lessonItem.lesson !== null ? lessonItem.lesson.id : lessonItem.lesson;
                        return completedLessonIds.includes(lessonId);
                    });
                    if (allRequiredLessonsCompleted && !courseProgress.completed) {
                        // Mark course as completed
                        courseProgress.completed = true;
                        courseProgress.completedAt = new Date().toISOString();
                        // Update course collection - add student to courseCompletedStudents and remove from enrolledStudents
                        const enrolledStudentIds = (Array.isArray(course.enrolledStudents) ? course.enrolledStudents : []).map((student)=>typeof student === 'object' ? student.id : student);
                        const courseCompletedStudents = (Array.isArray(course.courseCompletedStudents) ? course.courseCompletedStudents : []).map((student)=>typeof student === 'object' ? student.id : student);
                        // Remove user from enrolledStudents and add to courseCompletedStudents
                        const updatedEnrolledStudents = enrolledStudentIds.filter((id)=>id !== user.id);
                        const updatedCompletedStudents = courseCompletedStudents.includes(user.id) ? courseCompletedStudents : [
                            ...courseCompletedStudents,
                            user.id
                        ];
                        await payload.update({
                            collection: 'courses',
                            id: courseId,
                            data: {
                                enrolledStudents: updatedEnrolledStudents,
                                courseCompletedStudents: updatedCompletedStudents
                            }
                        });
                        payload.logger.info(`User ${user.id} completed course ${courseId} after completing lesson ${lessonId}`);
                    }
                }
            } catch (error) {
                payload.logger.warn(`Could not check course completion for course ${courseId}: ${error}`);
            }
            await payload.update({
                collection: userSlug,
                id: user.id,
                data: {
                    coursesProgress
                }
            });
            payload.logger.info(`User ${user.id} completed lesson ${lessonId} in course ${courseId}`);
            return Response.json({
                success: true,
                message: 'Successfully completed lesson.'
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

//# sourceMappingURL=complete-lesson.js.map