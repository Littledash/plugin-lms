import { addDataAndFileToRequest } from 'payload';
export const enrollHandler = ({ userSlug = 'users', courseSlug = 'courses', groupSlug = 'groups' })=>async (req)=>{
        await addDataAndFileToRequest(req);
        const data = req.data;
        const user = req.user;
        const payload = req.payload;
        const courseId = data?.courseId;
        const isGroup = data?.isGroup || false;
        const companyName = data?.companyName || '';
        const userId = data?.userId || '';
        let isLeader = data?.isLeader || false;
        const totalSeats = data?.totalSeats || 1;
        const couponId = data?.couponId || null;
        if (!user || !userId) {
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
            const enrolledStudentIds = (course?.enrolledStudents || []).map((student)=>typeof student === 'object' ? student.id : student);
            const enrolledGroupIds = (course?.courseEnrolledGroups || []).map((group)=>typeof group === 'object' ? group.id : group);
            const enrolledCourseIds = (Array.isArray(currentUser.enrolledCourses) ? currentUser.enrolledCourses : []).map((course)=>typeof course === 'object' ? course.id : course);
            const completedCourseIds = (Array.isArray(currentUser.completedCourses) ? currentUser.completedCourses : []).map((course)=>typeof course === 'object' ? course.id : course);
            if (isGroup) {
                let group = null;
                if (groupSlug) {
                    const { docs: existingGroups } = await payload.find({
                        collection: groupSlug,
                        where: {
                            or: [
                                ...companyName ? [
                                    {
                                        title: {
                                            equals: companyName
                                        }
                                    }
                                ] : [],
                                ...couponId ? [
                                    {
                                        'purchasedCourses.seatManagement.coupon': {
                                            equals: couponId
                                        }
                                    }
                                ] : []
                            ]
                        },
                        depth: 1
                    });
                    if (existingGroups.length > 0) {
                        group = existingGroups[0] || null;
                        payload.logger.info(`Found existing group '${companyName}' with id ${group?.id}`);
                        const currentLeaders = (group.leaders || []).map((leader)=>typeof leader === 'string' ? leader : leader.id);
                        const currentStudents = (group.students || []).map((student)=>typeof student === 'string' ? student : student.id);
                        const currentPurchasedCourses = (group.purchasedCourses || []).map((purchasedCourse)=>purchasedCourse?.seatManagement?.course).filter(Boolean).map((course)=>typeof course === 'string' ? course : course.id);
                        const updatedData = {};
                        if (isLeader && !currentLeaders.includes(user.id)) {
                            updatedData.leaders = [
                                ...currentLeaders,
                                user.id
                            ];
                        }
                        if (!isLeader && !currentStudents.includes(user.id)) {
                            updatedData.students = [
                                ...currentStudents,
                                user.id
                            ];
                        }
                        const seatsUsed = currentLeaders.length + currentStudents.length;
                        if (!currentPurchasedCourses.includes(courseId)) {
                            // Add the course to purchasedCourses with seat management structure
                            const newPurchasedCourse = {
                                seatManagement: {
                                    seatsTotal: totalSeats,
                                    seatsUsed: seatsUsed > 0 ? seatsUsed + 1 : 1,
                                    course: courseId,
                                    coupon: couponId || null
                                }
                            };
                            updatedData.purchasedCourses = [
                                ...group.purchasedCourses || [],
                                newPurchasedCourse
                            ];
                        } else {
                            // Group already has this course - increment seatsUsed
                            const updatedPurchasedCourses = (group.purchasedCourses || []).map((purchasedCourse)=>{
                                if (purchasedCourse?.seatManagement?.course === courseId || typeof purchasedCourse?.seatManagement?.course === 'object' && purchasedCourse?.seatManagement?.course?.id === courseId) {
                                    return {
                                        ...purchasedCourse,
                                        seatManagement: {
                                            ...purchasedCourse.seatManagement,
                                            seatsUsed: (purchasedCourse.seatManagement.seatsUsed || 0) + 1
                                        }
                                    };
                                }
                                return purchasedCourse;
                            });
                            updatedData.purchasedCourses = updatedPurchasedCourses;
                        }
                        if (Object.keys(updatedData).length > 0) {
                            await payload.update({
                                collection: 'groups',
                                id: group.id,
                                data: updatedData
                            });
                            payload.logger.info(`Updated group ${group.id} with new student/course.`);
                        } else {
                            payload.logger.info(`Group ${group.id} already up-to-date.`);
                        }
                    } else {
                        if (!companyName) {
                            payload.logger.error('Company name is required to create a new group for group enrollment.');
                            return Response.json({
                                message: 'Company name is required to create a new group for group enrollment.'
                            }, {
                                status: 400
                            });
                        }
                        payload.logger.info(`No existing group found for '${companyName}'`);
                        const newGroupData = {
                            title: companyName,
                            ...isLeader ? {
                                leaders: [
                                    user.id
                                ]
                            } : {
                                students: [
                                    user.id
                                ]
                            },
                            purchasedCourses: [
                                {
                                    seatManagement: {
                                        seatsTotal: totalSeats,
                                        seatsUsed: 1,
                                        course: courseId,
                                        coupon: couponId || null
                                    }
                                }
                            ]
                        };
                        const newGroup = await payload.create({
                            collection: 'groups',
                            data: newGroupData
                        });
                        group = newGroup;
                        payload.logger.info(`Created new group '${companyName}' with id ${group?.id}`);
                    }
                    // Add group to course's courseEnrolledGroups array
                    const currentEnrolledGroups = (course.courseEnrolledGroups || []).map((g)=>typeof g === 'string' ? g : g.id);
                    if (!currentEnrolledGroups.includes(group.id)) {
                        await payload.update({
                            collection: courseSlug,
                            id: courseId,
                            data: {
                                courseEnrolledGroups: [
                                    ...currentEnrolledGroups,
                                    group.id
                                ]
                            }
                        });
                        payload.logger.info(`Added group ${group.title} to course ${course.title}'s enrolled groups`);
                    } else {
                        payload.logger.info(`Group ${group.title} is already enrolled in course ${course.title}`);
                    }
                }
                if (isLeader && !currentUser.roles?.includes('leader') && group) {
                    payload.logger.info(`Adding leader role to user ${currentUser.id} for group ${group?.title}`);
                    const currentRoles = currentUser.roles || [];
                    const newRoles = [
                        ...currentRoles,
                        'leader'
                    ];
                    await payload.update({
                        collection: userSlug,
                        id: currentUser.id,
                        data: {
                            roles: newRoles
                        }
                    });
                }
                payload.logger.info(`User ${currentUser.id} is now a leader of group ${group?.title}`);
            }
            // Initialize course progress for the user
            const coursesProgress = Array.isArray(currentUser.coursesProgress) ? currentUser.coursesProgress : [];
            // Check if course progress already exists for this course
            const courseProgressExists = coursesProgress.some((progress)=>{
                if (typeof progress.course === 'object' && progress.course !== null) {
                    return progress.course.id === courseId;
                }
                return progress.course === courseId;
            });
            if (enrolledStudentIds?.includes(user.id) || enrolledCourseIds.includes(courseId)) {
                if (!courseProgressExists) {
                    // Create new course progress entry
                    const newCourseProgress = {
                        course: courseId,
                        completed: false,
                        completedLessons: [],
                        completedQuizzes: []
                    };
                    await payload.update({
                        collection: userSlug,
                        id: currentUser.id,
                        data: {
                            coursesProgress: [
                                ...coursesProgress,
                                newCourseProgress
                            ]
                        }
                    });
                    payload.logger.info(`User ${currentUser.id} course progress created for course ${courseId}`);
                }
                return Response.json({
                    message: 'You are already enrolled in this course.'
                }, {
                    status: 200
                });
            }
            if (completedCourseIds.includes(courseId)) {
                return Response.json({
                    message: 'You have already completed this course.'
                }, {
                    status: 200
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
            if (!courseProgressExists) {
                // Create new course progress entry
                const newCourseProgress = {
                    course: courseId,
                    completed: false,
                    completedLessons: [],
                    completedQuizzes: []
                };
                await payload.update({
                    collection: userSlug,
                    id: currentUser.id,
                    data: {
                        coursesProgress: [
                            ...coursesProgress,
                            newCourseProgress
                        ]
                    }
                });
                payload.logger.info(`User ${currentUser.id} course progress created for course ${courseId}`);
            }
            payload.logger.info(`User ${currentUser.id} enrolled in course ${courseId}`);
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