import { asSlug, ensureCourseProgress, findDoc, getCoursesProgress, getSlugs, includesId, LMSError, sameId, toId, toIds, withTransaction } from './shared.js';
const findExistingGroup = async (req, userId, { companyName, couponId })=>{
    const where = couponId ? {
        'purchasedCourses.seatManagement.coupon': {
            equals: couponId
        }
    } : {
        and: [
            {
                leaders: {
                    in: [
                        userId
                    ]
                }
            },
            ...companyName ? [
                {
                    title: {
                        equals: companyName
                    }
                }
            ] : []
        ]
    };
    const { docs } = await req.payload.find({
        collection: asSlug(getSlugs(req).groups),
        depth: 0,
        limit: 1,
        req,
        where
    });
    return docs[0];
};
const enrollGroup = async ({ course, group: groupArgs, req, user })=>{
    const slugs = getSlugs(req);
    const { companyName, couponId = null, isLeader = false, totalSeats = 1 } = groupArgs;
    const memberField = isLeader ? 'leaders' : 'students';
    let group = await findExistingGroup(req, user.id, groupArgs);
    if (group) {
        const members = toIds(group[memberField]);
        const isNewMember = !includesId(members, user.id);
        const purchasedCourses = Array.isArray(group.purchasedCourses) ? group.purchasedCourses : [];
        const purchase = purchasedCourses.find((entry)=>sameId(entry?.seatManagement?.course, course.id));
        const data = {};
        if (isNewMember) {
            data[memberField] = [
                ...members,
                user.id
            ];
        }
        if (!purchase) {
            data.purchasedCourses = [
                ...purchasedCourses,
                {
                    seatManagement: {
                        coupon: couponId,
                        course: course.id,
                        seatsTotal: totalSeats,
                        seatsUsed: 1
                    }
                }
            ];
        } else if (isNewMember) {
            data.purchasedCourses = purchasedCourses.map((entry)=>entry === purchase ? {
                    ...entry,
                    seatManagement: {
                        ...entry.seatManagement,
                        seatsUsed: (entry.seatManagement.seatsUsed || 0) + 1
                    }
                } : entry);
        }
        if (Object.keys(data).length > 0) {
            group = await req.payload.update({
                id: group.id,
                collection: asSlug(slugs.groups),
                data,
                req
            });
        }
    } else {
        if (!companyName) {
            throw new LMSError('Company name is required to create a new group.', 400);
        }
        group = await req.payload.create({
            collection: asSlug(slugs.groups),
            data: {
                [memberField]: [
                    user.id
                ],
                purchasedCourses: [
                    {
                        seatManagement: {
                            coupon: couponId,
                            course: course.id,
                            seatsTotal: totalSeats,
                            seatsUsed: 1
                        }
                    }
                ],
                title: companyName
            },
            req
        });
        req.payload.logger.info(`Created group ${group.id} for course ${course.id}`);
    }
    const enrolledGroups = toIds(course.courseEnrolledGroups);
    if (!includesId(enrolledGroups, group.id)) {
        await req.payload.update({
            id: course.id,
            collection: asSlug(slugs.courses),
            data: {
                courseEnrolledGroups: [
                    ...enrolledGroups,
                    group.id
                ]
            },
            req
        });
    }
    const roles = Array.isArray(user.roles) ? user.roles : [];
    if (isLeader && !roles.includes('leader')) {
        await req.payload.update({
            id: user.id,
            collection: asSlug(slugs.students),
            data: {
                roles: [
                    ...roles,
                    'leader'
                ]
            },
            req
        });
    }
    return group.id;
};
/**
 * Enrolls a user in a course, optionally through a group purchase.
 *
 * This is a trusted server-side operation: it does not check payment. Call it only after the
 * purchase has been verified, with a `userId` taken from trusted server state.
 */ export const enrollUser = ({ courseId, group, req, userId })=>withTransaction(req, async ()=>{
        const slugs = getSlugs(req);
        const user = await findDoc(req, slugs.students, userId, 'User');
        // The group step may update the course, so read it again afterwards
        let course = await findDoc(req, slugs.courses, courseId, 'Course');
        const groupId = group ? await enrollGroup({
            course,
            group,
            req,
            user
        }) : undefined;
        if (groupId !== undefined) {
            course = await findDoc(req, slugs.courses, courseId, 'Course');
        }
        const coursesProgress = getCoursesProgress(user);
        const hadProgress = coursesProgress.some((progress)=>sameId(progress.course, course.id));
        const saveProgress = async ()=>{
            if (hadProgress) {
                return;
            }
            ensureCourseProgress(coursesProgress, course.id);
            await req.payload.update({
                id: user.id,
                collection: asSlug(slugs.students),
                data: {
                    coursesProgress
                },
                req
            });
        };
        if (includesId(toIds(course.enrolledStudents), user.id)) {
            await saveProgress();
            return {
                groupId,
                status: 'already-enrolled'
            };
        }
        if (includesId(toIds(course.courseCompletedStudents), user.id)) {
            return {
                groupId,
                status: 'already-completed'
            };
        }
        await req.payload.update({
            id: course.id,
            collection: asSlug(slugs.courses),
            data: {
                enrolledStudents: [
                    ...toIds(course.enrolledStudents),
                    user.id
                ]
            },
            req
        });
        await saveProgress();
        req.payload.logger.info(`User ${user.id} enrolled in course ${toId(course)}`);
        return {
            groupId,
            status: 'enrolled'
        };
    });
/**
 * Access modes a user can enroll in themselves without a purchase.
 */ export const SELF_ENROLL_ACCESS_MODES = [
    'open',
    'free'
];

//# sourceMappingURL=enrollUser.js.map