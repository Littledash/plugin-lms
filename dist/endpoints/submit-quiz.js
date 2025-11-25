import { addDataAndFileToRequest } from 'payload';
export const submitQuizHandler = ({ userSlug = 'users', quizzesSlug = 'quizzes' })=>async (req)=>{
        await addDataAndFileToRequest(req);
        const data = req.data;
        const user = req.user;
        const payload = req.payload;
        const courseId = data?.courseId;
        const quizId = data?.quizId;
        const answers = data?.answers;
        if (!user) {
            return Response.json({
                message: 'You must be logged in to submit a quiz.'
            }, {
                status: 401
            });
        }
        if (!courseId || !quizId || !answers) {
            return Response.json({
                message: 'Course ID, Quiz ID, and answers are required.'
            }, {
                status: 400
            });
        }
        try {
            const quiz = await payload.findByID({
                collection: quizzesSlug,
                id: quizId,
                depth: 2
            });
            if (!quiz) {
                return Response.json({
                    message: 'Quiz not found.'
                }, {
                    status: 404
                });
            }
            // Basic grading logic
            let correctAnswers = 0;
            if (quiz.questions && Array.isArray(quiz.questions)) {
                for (const question of quiz.questions){
                    if (question && typeof question === 'object') {
                        const submittedAnswer = answers[question.id];
                        // Handle different question types
                        if (question.questionType === 'trueFalse') {
                            // For true/false questions, compare with correctAnswer field
                            // If correctAnswer is 'both', accept either 'true' or 'false'
                            if (question.correctAnswer === 'both' ? submittedAnswer === 'true' || submittedAnswer === 'false' : submittedAnswer === question.correctAnswer) {
                                correctAnswers++;
                            }
                        } else if (question.questionType === 'multipleChoice' || question.questionType === 'singleChoice') {
                            // For multiple choice questions, find the correct choice ID
                            if (question.choices && Array.isArray(question.choices)) {
                                const correctChoice = question.choices.find((choice)=>choice.isCorrect);
                                if (correctChoice && submittedAnswer === correctChoice.id) {
                                    correctAnswers++;
                                }
                            }
                        }
                    // Add support for other question types as needed
                    }
                }
            }
            const score = quiz.questions.length > 0 ? correctAnswers / quiz.questions.length * 100 : 0;
            const currentUser = await payload.findByID({
                collection: userSlug,
                id: user.id
            });
            if (!currentUser) {
                return Response.json({
                    message: 'User not found.'
                }, {
                    status: 404
                });
            }
            const coursesProgress = currentUser.coursesProgress || [];
            let courseProgressIndex = coursesProgress.findIndex((cp)=>{
                // Handle both full course objects and course IDs for backward compatibility
                if (typeof cp.course === 'object' && cp.course !== null) {
                    return cp.course.id === courseId;
                }
                return cp.course === courseId;
            });
            if (courseProgressIndex === -1) {
                // Create new course progress entry
                coursesProgress.push({
                    course: courseId,
                    completed: false,
                    completedLessons: [],
                    completedQuizzes: []
                });
                courseProgressIndex = coursesProgress.length - 1;
            }
            const courseProgress = coursesProgress[courseProgressIndex];
            const quizExists = courseProgress.completedQuizzes.some((cq)=>{
                // Handle both full quiz objects and quiz IDs for backward compatibility
                if (typeof cq.quiz === 'object' && cq.quiz !== null) {
                    return cq.quiz.id === quizId;
                }
                return cq.quiz === quizId;
            });
            if (!quizExists) {
                courseProgress.completedQuizzes.push({
                    quiz: quizId,
                    score: score,
                    completedAt: new Date().toISOString()
                });
            } else {
                // Update existing quiz score
                const quizIndex = courseProgress.completedQuizzes.findIndex((cq)=>{
                    // Handle both full quiz objects and quiz IDs for backward compatibility
                    if (typeof cq.quiz === 'object' && cq.quiz !== null) {
                        return cq.quiz.id === quizId;
                    }
                    return cq.quiz === quizId;
                });
                if (quizIndex !== -1) {
                    // Update the quiz score if the new score is higher. The user can only improve their score on the same quiz.
                    if (score > courseProgress.completedQuizzes[quizIndex].score) {
                        courseProgress.completedQuizzes[quizIndex].score = score;
                        courseProgress.completedQuizzes[quizIndex].completedAt = new Date().toISOString();
                    }
                }
            }
            await payload.update({
                collection: userSlug,
                id: user.id,
                data: {
                    coursesProgress
                }
            });
            payload.logger.info(`User ${user.id} submitted quiz ${quizId} in course ${courseId} and scored ${score}`);
            if (score >= quiz.minimumScore) {
                // Mark the lesson as completed if quiz is passed
                const lessonId = quiz.lesson;
                if (lessonId) {
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
                }
                payload.logger.info(`User ${user.id} completed lesson ${lessonId} in course ${courseId}`);
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
                            payload.logger.info(`User ${user.id} completed course ${courseId} after passing quiz ${quizId}`);
                        }
                    }
                } catch (error) {
                    payload.logger.warn(`Could not check course completion for course ${courseId}: ${error}`);
                }
                // Update user progress with the new lesson completion and potential course completion
                await payload.update({
                    collection: userSlug,
                    id: user.id,
                    data: {
                        coursesProgress
                    }
                });
                payload.logger.info(`User ${user.id} submitted quiz ${quizId} in course ${courseId} and scored ${score}`);
                return Response.json({
                    success: true,
                    message: 'Quiz submitted successfully and successfully passed',
                    score,
                    passed: true
                });
            }
            return Response.json({
                success: true,
                message: 'Quiz submitted successfully but you did not pass. You can try again. Required score: ' + quiz.minimumScore + '%',
                score,
                passed: false
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred submitting quiz. Please try again.';
            payload.logger.error(message);
            return Response.json({
                message,
                passed: false,
                score: 0
            }, {
                status: 500
            });
        }
    };

//# sourceMappingURL=submit-quiz.js.map