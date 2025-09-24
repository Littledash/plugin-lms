import { addDataAndFileToRequest } from 'payload';
export const fetchProgressHandler = ({ userSlug = 'users', courseSlug = 'courses' })=>async (req)=>{
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
            // Calculate completion percentage for each course progress
            const normalizedProgress = await Promise.all(coursesProgress.map(async (progress)=>{
                const courseId = typeof progress.course === 'object' && progress.course !== null ? progress.course.id : progress.course;
                // Fetch course data to get total required lessons
                let completionPercentage = 0;
                try {
                    const course = await payload.findByID({
                        collection: courseSlug,
                        id: courseId,
                        depth: 1
                    });
                    if (course && course.lessons) {
                        // Count total required lessons (non-optional)
                        const totalRequiredLessons = course.lessons.filter((lessonItem)=>!lessonItem.isOptional).length;
                        // Count completed lessons
                        const completedLessonIds = progress.completedLessons?.map((lesson)=>typeof lesson.lesson === 'object' && lesson.lesson !== null ? lesson.lesson.id : lesson.lesson) || [];
                        // Calculate percentage
                        if (totalRequiredLessons > 0) {
                            completionPercentage = Math.round(completedLessonIds.length / totalRequiredLessons * 100);
                        }
                    }
                } catch (error) {
                    payload.logger.warn(`Could not fetch course ${courseId} for completion percentage calculation: ${error}`);
                }
                return {
                    ...progress,
                    course: courseId,
                    completionPercentage,
                    completedLessons: progress.completedLessons?.map((lesson)=>({
                            ...lesson,
                            lesson: typeof lesson.lesson === 'object' && lesson.lesson !== null ? lesson.lesson.id : lesson.lesson
                        })) || [],
                    completedQuizzes: progress.completedQuizzes?.map((quiz)=>({
                            ...quiz,
                            quiz: typeof quiz.quiz === 'object' && quiz.quiz !== null ? quiz.quiz.id : quiz.quiz
                        })) || []
                };
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