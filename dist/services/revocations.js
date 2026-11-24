import { asSlug, findDoc, getCoursesProgress, getSlugs, includesId, isActivePurchase, isEnrolledInCourse, LMSError, sameId, toId, toIds, withTransaction } from './shared.js';
const MAX_REASON_LENGTH = 200;
const requireReason = (reason)=>{
    if (reason === undefined || reason === null) {
        return null;
    }
    if (typeof reason !== 'string' || reason.length > MAX_REASON_LENGTH) {
        throw new LMSError(`reason must be a string of at most ${MAX_REASON_LENGTH} characters.`, 400);
    }
    return reason.trim() || null;
};
/** Leaders and students of a group, each once. */ export const groupMemberIds = (group)=>[
        ...toIds(group.leaders),
        ...toIds(group.students)
    ].filter((id, index, all)=>all.findIndex((other)=>sameId(other, id)) === index);
const saveProgress = async (req, user, coursesProgress)=>{
    await req.payload.update({
        id: user.id,
        collection: asSlug(getSlugs(req).students),
        data: {
            coursesProgress
        },
        req
    });
};
/** Marks the user's progress on the course revoked, keeping it so a new purchase restores it. */ const markRevoked = async (req, user, courseId, reason)=>{
    const coursesProgress = getCoursesProgress(user);
    const progress = coursesProgress.find((entry)=>sameId(entry.course, courseId));
    if (!progress || progress.revokedAt) {
        return;
    }
    progress.revokedAt = new Date().toISOString();
    progress.revokedReason = reason;
    await saveProgress(req, user, coursesProgress);
};
/** Clears revoked progress on the course, for users who have access again through a group. */ export const clearRevocations = async ({ courseId, req, userIds })=>{
    const slugs = getSlugs(req);
    for (const userId of userIds){
        const user = await findDoc(req, slugs.students, userId, 'User');
        const coursesProgress = getCoursesProgress(user);
        const progress = coursesProgress.find((entry)=>sameId(entry.course, courseId));
        if (progress?.revokedAt) {
            progress.revokedAt = null;
            progress.revokedReason = null;
            await saveProgress(req, user, coursesProgress);
        }
    }
};
/**
 * Takes a user's access to a course away, for example after a refund or a payment dispute. The
 * user is removed from the course's enrolled and completed students, which stops access to its
 * lessons, topics, quizzes, files and materials. Their progress is kept, marked revoked, so
 * `enrollUser` for a new purchase restores it with a fresh access period. Certificates already
 * awarded are not touched. Safe to call again: a user who is not listed is left alone.
 *
 * Trusted server-side operation, like `enrollUser`: call it only with a `userId` from verified
 * server state, such as a payment provider webhook.
 */ export const unenrollUser = ({ courseId, reason, req, userId })=>withTransaction(req, async ()=>{
        const revokedReason = requireReason(reason);
        const slugs = getSlugs(req);
        const user = await findDoc(req, slugs.students, userId, 'User');
        const course = await findDoc(req, slugs.courses, courseId, 'Course');
        const enrolledStudents = toIds(course.enrolledStudents);
        const completedStudents = toIds(course.courseCompletedStudents);
        const isListed = includesId(enrolledStudents, user.id) || includesId(completedStudents, user.id);
        let updatedCourse = course;
        if (isListed) {
            updatedCourse = await req.payload.update({
                id: course.id,
                collection: asSlug(slugs.courses),
                data: {
                    courseCompletedStudents: completedStudents.filter((id)=>!sameId(id, user.id)),
                    enrolledStudents: enrolledStudents.filter((id)=>!sameId(id, user.id))
                },
                depth: 0,
                req
            });
            await markRevoked(req, user, course.id, revokedReason);
            req.payload.logger.info(`User ${user.id} unenrolled from course ${toId(course)}`);
        }
        return {
            groupAccess: await isEnrolledInCourse(req, updatedCourse, user.id),
            status: isListed ? 'unenrolled' : 'not-enrolled'
        };
    });
/**
 * Takes a course away from a group, for example after its purchase was refunded or disputed. The
 * group is removed from the course's enrolled groups and its purchase of the course is marked
 * revoked: the purchase's coupon stops working and takes no more seats. Every leader and student of
 * the group loses the course unless they still have access through another group, or are listed in
 * `keepUserIds` (members who bought the course themselves). Their progress is kept, marked revoked,
 * and certificates already awarded are not touched. Group membership and other courses the group
 * bought are not changed. Safe to call again.
 *
 * A new purchase by a leader of the same group (`enrollUser` with `group.isLeader`) restores the
 * purchase with the seats bought and gives every member the course back.
 *
 * Trusted server-side operation: call it only with IDs from verified server state.
 */ export const unenrollGroup = ({ courseId, groupId, keepUserIds = [], reason, req })=>withTransaction(req, async ()=>{
        const revokedReason = requireReason(reason);
        const slugs = getSlugs(req);
        const group = await findDoc(req, slugs.groups, groupId, 'Group');
        const course = await findDoc(req, slugs.courses, courseId, 'Course');
        const purchasedCourses = Array.isArray(group.purchasedCourses) ? group.purchasedCourses : [];
        const purchase = purchasedCourses.find((entry)=>sameId(entry?.seatManagement?.course, course.id));
        if (purchase && isActivePurchase(purchase)) {
            await req.payload.update({
                id: group.id,
                collection: asSlug(slugs.groups),
                data: {
                    purchasedCourses: purchasedCourses.map((entry)=>entry === purchase ? {
                            ...entry,
                            seatManagement: {
                                ...entry.seatManagement,
                                revokedAt: new Date().toISOString(),
                                revokedReason
                            }
                        } : entry)
                },
                req
            });
        }
        const memberIds = groupMemberIds(group).filter((id)=>!includesId(keepUserIds, id));
        const enrolledGroups = toIds(course.courseEnrolledGroups);
        const enrolledStudents = toIds(course.enrolledStudents);
        const completedStudents = toIds(course.courseCompletedStudents);
        const delisted = memberIds.filter((id)=>includesId(enrolledStudents, id) || includesId(completedStudents, id));
        if (!includesId(enrolledGroups, group.id) && delisted.length === 0) {
            return {
                status: 'not-enrolled',
                unenrolledUserIds: []
            };
        }
        const updatedCourse = await req.payload.update({
            id: course.id,
            collection: asSlug(slugs.courses),
            data: {
                courseCompletedStudents: completedStudents.filter((id)=>!includesId(delisted, id)),
                courseEnrolledGroups: enrolledGroups.filter((id)=>!sameId(id, group.id)),
                enrolledStudents: enrolledStudents.filter((id)=>!includesId(delisted, id))
            },
            depth: 0,
            req
        });
        const unenrolledUserIds = [];
        for (const memberId of memberIds){
            if (await isEnrolledInCourse(req, updatedCourse, memberId)) {
                continue;
            }
            unenrolledUserIds.push(memberId);
            await markRevoked(req, await findDoc(req, slugs.students, memberId, 'User'), course.id, revokedReason);
        }
        req.payload.logger.info(`Group ${group.id} unenrolled from course ${toId(course)}; ${unenrolledUserIds.length} members lost access`);
        return {
            status: 'unenrolled',
            unenrolledUserIds
        };
    });

//# sourceMappingURL=revocations.js.map