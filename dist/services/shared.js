import { APIError, commitTransaction, initTransaction, killTransaction } from 'payload';
import { defaultCollectionSlugMap } from '../utilities/getCollectionSlugMap.js';
/**
 * An error whose message is safe to return to the client.
 */ export class LMSError extends APIError {
    constructor(message, status){
        super(message, status, null, true);
    }
}
export const toId = (value)=>value && typeof value === 'object' ? value.id : value ?? undefined;
export const toIds = (values)=>Array.isArray(values) ? values.map((value)=>toId(value)).filter((id)=>id !== undefined) : [];
/**
 * Compares IDs as strings so ObjectId instances and string IDs match.
 */ export const sameId = (a, b)=>{
    const idA = toId(a);
    const idB = toId(b);
    return idA !== undefined && idB !== undefined && String(idA) === String(idB);
};
export const includesId = (ids, id)=>ids.some((candidate)=>sameId(candidate, id));
export const getSlugs = (req)=>({
        ...defaultCollectionSlugMap,
        ...req.payload.config.custom?.lms?.slugs
    });
export const asSlug = (slug)=>slug;
/**
 * Runs `fn` inside a transaction, reusing one already open on `req`.
 */ export const withTransaction = async (req, fn)=>{
    const shouldCommit = await initTransaction(req);
    try {
        const result = await fn();
        if (shouldCommit) {
            await commitTransaction(req);
        }
        return result;
    } catch (error) {
        if (shouldCommit) {
            await killTransaction(req);
        }
        throw error;
    }
};
export const findDoc = async (req, collection, id, label)=>{
    const doc = await req.payload.findByID({
        id,
        collection: asSlug(collection),
        depth: 0,
        disableErrors: true,
        req
    });
    if (!doc) {
        throw new LMSError(`${label} not found.`, 404);
    }
    return doc;
};
/**
 * Normalises the user's progress to IDs so it can be compared and saved back.
 */ export const getCoursesProgress = (user)=>(Array.isArray(user.coursesProgress) ? user.coursesProgress : []).map((progress)=>({
            ...progress,
            completedLessons: (progress.completedLessons || []).map((entry)=>({
                    ...entry,
                    lesson: toId(entry.lesson)
                })),
            completedQuizzes: (progress.completedQuizzes || []).map((entry)=>({
                    ...entry,
                    quiz: toId(entry.quiz)
                })),
            course: toId(progress.course)
        }));
/**
 * Returns the progress entry for a course, adding an empty one when missing.
 */ export const ensureCourseProgress = (coursesProgress, courseId)=>{
    let progress = coursesProgress.find((entry)=>sameId(entry.course, courseId));
    if (!progress) {
        progress = {
            completed: false,
            completedLessons: [],
            completedQuizzes: [],
            course: courseId
        };
        coursesProgress.push(progress);
    }
    return progress;
};
export const getCourseLessonIds = (course, { requiredOnly = false } = {})=>(Array.isArray(course.lessons) ? course.lessons : []).filter((item)=>!requiredOnly || !item.isOptional).map((item)=>toId(item.lesson)).filter((id)=>id !== undefined);
export const hasCompletedRequiredLessons = (course, progress)=>{
    const completedLessonIds = progress.completedLessons.map((entry)=>entry.lesson);
    return getCourseLessonIds(course, {
        requiredOnly: true
    }).every((lessonId)=>includesId(completedLessonIds, lessonId));
};
/**
 * A user is enrolled when they are listed on the course directly, have completed it,
 * or belong to a group enrolled in it.
 */ export const isEnrolledInCourse = async (req, course, userId)=>{
    if (includesId(toIds(course.enrolledStudents), userId) || includesId(toIds(course.courseCompletedStudents), userId)) {
        return true;
    }
    const groupIds = toIds(course.courseEnrolledGroups);
    if (groupIds.length === 0) {
        return false;
    }
    const { totalDocs } = await req.payload.count({
        collection: asSlug(getSlugs(req).groups),
        req,
        where: {
            and: [
                {
                    id: {
                        in: groupIds
                    }
                },
                {
                    or: [
                        {
                            students: {
                                in: [
                                    userId
                                ]
                            }
                        },
                        {
                            leaders: {
                                in: [
                                    userId
                                ]
                            }
                        }
                    ]
                }
            ]
        }
    });
    return totalDocs > 0;
};
export const requireUser = (req)=>{
    if (!req.user) {
        throw new LMSError('You must be logged in.', 401);
    }
    return req.user.id;
};

//# sourceMappingURL=shared.js.map