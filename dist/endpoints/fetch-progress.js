import { addDataAndFileToRequest } from 'payload';
export const fetchProgressHandler = ({ userSlug = 'users' })=>async (req)=>{
        await addDataAndFileToRequest(req);
        const user = req.user;
        const payload = req.payload;
        if (!user) {
            return Response.json({
                message: 'You must be logged in to fetch progress.'
            }, {
                status: 401
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
            const enrolledCourses = currentUser.enrolledCourses || [];
            const completedCourses = currentUser.completedCourses || [];
            // Normalize progress data to use IDs only
            const normalizedProgress = coursesProgress.map((progress)=>({
                    ...progress,
                    course: typeof progress.course === 'object' && progress.course !== null ? progress.course.id : progress.course,
                    completedLessons: progress.completedLessons?.map((lesson)=>({
                            ...lesson,
                            lesson: typeof lesson.lesson === 'object' && lesson.lesson !== null ? lesson.lesson.id : lesson.lesson
                        })) || [],
                    completedQuizzes: progress.completedQuizzes?.map((quiz)=>({
                            ...quiz,
                            quiz: typeof quiz.quiz === 'object' && quiz.quiz !== null ? quiz.quiz.id : quiz.quiz
                        })) || []
                }));
            // Normalize enrolled and completed courses to use IDs only
            const enrolledCoursesArray = Array.isArray(enrolledCourses) ? enrolledCourses : [];
            const completedCoursesArray = Array.isArray(completedCourses) ? completedCourses : [];
            const normalizedEnrolledCourses = enrolledCoursesArray.map((course)=>typeof course === 'object' && course !== null ? course.id : course);
            const normalizedCompletedCourses = completedCoursesArray.map((course)=>typeof course === 'object' && course !== null ? course.id : course);
            payload.logger.info(`Fetched progress for user ${user.id}`);
            return Response.json({
                coursesProgress: normalizedProgress,
                enrolledCourses: normalizedEnrolledCourses,
                completedCourses: normalizedCompletedCourses
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

//# sourceMappingURL=fetch-progress.js.map