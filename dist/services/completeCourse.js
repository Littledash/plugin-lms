import { isAccessExpired } from './lessonAccess.js';
import { asSlug, ensureCourseProgress, findDoc, getCoursesProgress, getSlugs, hasCompletedRequiredLessons, includesId, isEnrolledInCourse, LMSError, sameId, toId, toIds, withTransaction } from './shared.js';
/**
 * Marks the course complete on the course and in the user's progress and awards the course
 * certificate if it has one. Returns the user fields to save; the caller saves them so the user
 * is updated once (consumer hooks on the users collection see progress and certificates together).
 */ export const markCourseCompleted = async ({ course, coursesProgress, req, user })=>{
    const now = new Date().toISOString();
    const progress = ensureCourseProgress(coursesProgress, course.id);
    if (!progress.completed) {
        progress.completed = true;
        progress.completedAt = now;
    }
    const completedStudents = toIds(course.courseCompletedStudents);
    if (!includesId(completedStudents, user.id)) {
        await req.payload.update({
            id: course.id,
            collection: asSlug(getSlugs(req).courses),
            context: {
                lmsCourseCompletion: true
            },
            data: {
                courseCompletedStudents: [
                    ...completedStudents,
                    user.id
                ],
                enrolledStudents: toIds(course.enrolledStudents).filter((id)=>!sameId(id, user.id))
            },
            req
        });
    }
    const userData = {
        coursesProgress
    };
    let certificateAwarded = false;
    const certificateId = toId(course.awards?.certificate);
    if (certificateId !== undefined) {
        const certificates = Array.isArray(user.certificates) ? user.certificates : [];
        const hasCertificate = certificates.some((entry)=>sameId(entry.certificate, certificateId) && sameId(entry.course, course.id));
        if (!hasCertificate) {
            userData.certificates = [
                ...certificates.map((entry)=>({
                        ...entry,
                        certificate: toId(entry.certificate),
                        course: toId(entry.course)
                    })),
                {
                    certificate: certificateId,
                    completedDate: now,
                    course: course.id
                }
            ];
            certificateAwarded = true;
        }
    }
    return {
        certificateAwarded,
        userData
    };
};
/**
 * Completes a course for a user. Safe to call again: an already completed course only has a
 * missing certificate awarded.
 */ export const completeCourse = ({ courseId, req, requireLessons = true, userId })=>withTransaction(req, async ()=>{
        const slugs = getSlugs(req);
        const user = await findDoc(req, slugs.students, userId, 'User');
        const course = await findDoc(req, slugs.courses, courseId, 'Course');
        if (!await isEnrolledInCourse(req, course, user.id)) {
            throw new LMSError('You are not enrolled in this course.', 403);
        }
        const coursesProgress = getCoursesProgress(user);
        const progress = ensureCourseProgress(coursesProgress, course.id);
        const alreadyCompleted = includesId(toIds(course.courseCompletedStudents), user.id) && Boolean(progress.completed);
        if (!alreadyCompleted && isAccessExpired(course, progress)) {
            throw new LMSError('Your access to this course has expired.', 403);
        }
        if (!alreadyCompleted && requireLessons && !hasCompletedRequiredLessons(course, progress)) {
            throw new LMSError('All required lessons must be completed first.', 409);
        }
        const { certificateAwarded, userData } = await markCourseCompleted({
            course,
            coursesProgress,
            req,
            user
        });
        if (alreadyCompleted && !certificateAwarded) {
            return {
                certificateAwarded,
                status: 'already-completed'
            };
        }
        await req.payload.update({
            id: user.id,
            collection: asSlug(slugs.students),
            data: userData,
            req
        });
        req.payload.logger.info(`User ${user.id} completed course ${course.id}`);
        return {
            certificateAwarded,
            status: alreadyCompleted ? 'already-completed' : 'completed'
        };
    });

//# sourceMappingURL=completeCourse.js.map