import { asSlug, getSlugs, toId, toIds } from '../services/shared.js';
import { checkRole } from './checkRole.js';
const enrolledCourseIdsCache = new WeakMap();
/**
 * IDs of the courses the logged-in user is enrolled in, directly, through a group, or as a
 * completed student. Cached per request so field-level checks query once.
 */ export const getEnrolledCourseIds = (req)=>{
    let enrolledCourseIds = enrolledCourseIdsCache.get(req);
    if (!enrolledCourseIds) {
        enrolledCourseIds = (async ()=>{
            const userId = req.user?.id;
            if (userId === undefined) {
                return new Set();
            }
            const slugs = getSlugs(req);
            const { docs: groups } = await req.payload.find({
                collection: asSlug(slugs.groups),
                depth: 0,
                pagination: false,
                req,
                where: {
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
            });
            const groupIds = groups.map((group)=>group.id);
            const { docs: courses } = await req.payload.find({
                collection: asSlug(slugs.courses),
                depth: 0,
                pagination: false,
                req,
                where: {
                    or: [
                        {
                            enrolledStudents: {
                                in: [
                                    userId
                                ]
                            }
                        },
                        {
                            courseCompletedStudents: {
                                in: [
                                    userId
                                ]
                            }
                        },
                        ...groupIds.length > 0 ? [
                            {
                                courseEnrolledGroups: {
                                    in: groupIds
                                }
                            }
                        ] : []
                    ]
                }
            });
            return new Set(courses.map((course)=>String(course.id)));
        })();
        enrolledCourseIdsCache.set(req, enrolledCourseIds);
    }
    return enrolledCourseIds;
};
const isEnrolledIn = async (req, courseId)=>courseId !== undefined && (await getEnrolledCourseIds(req)).has(String(courseId));
/**
 * Whether any enrolled course lists one of these lessons. Courses own the lesson order in their
 * `lessons` array, so this works even when a lesson's own `course` field is not set.
 */ const isEnrolledInCourseWithLessons = async (req, lessonIds)=>{
    const enrolledCourseIds = [
        ...await getEnrolledCourseIds(req)
    ];
    if (enrolledCourseIds.length === 0 || lessonIds.length === 0) {
        return false;
    }
    const { totalDocs } = await req.payload.count({
        collection: asSlug(getSlugs(req).courses),
        req,
        where: {
            and: [
                {
                    id: {
                        in: toIds(enrolledCourseIds)
                    }
                },
                {
                    'lessons.lesson': {
                        in: lessonIds
                    }
                }
            ]
        }
    });
    return totalDocs > 0;
};
/**
 * Collection access for documents with a `course` relationship (e.g. lessons, topics).
 */ export const isAdminOrAuthorOrEnrolledInCourse = async ({ data, req })=>{
    if (!req.user) {
        return false;
    }
    if (checkRole([
        'admin',
        'author'
    ], req.user)) {
        return true;
    }
    return isEnrolledIn(req, toId(data?.course));
};
/**
 * Field access for documents with a `course` relationship (e.g. lessons, topics). Lessons without
 * one are matched through the courses that list them.
 */ export const isAdminOrAuthorOrEnrolledInCourseFieldLevel = async ({ doc, req })=>{
    if (!req.user) {
        return false;
    }
    if (checkRole([
        'admin',
        'author'
    ], req.user)) {
        return true;
    }
    const courseId = toId(doc?.course);
    if (courseId !== undefined) {
        return isEnrolledIn(req, courseId);
    }
    // Topics point at their lesson; lessons are matched by their own ID
    const lessonId = toId(doc?.lesson) ?? toId(doc?.id);
    return lessonId !== undefined && isEnrolledInCourseWithLessons(req, [
        lessonId
    ]);
};
/**
 * Field access for fields on the course document itself.
 */ export const isAdminOrAuthorOrEnrolledInThisCourseFieldLevel = async ({ doc, req })=>{
    if (!req.user) {
        return false;
    }
    if (checkRole([
        'admin',
        'author'
    ], req.user)) {
        return true;
    }
    return isEnrolledIn(req, toId(doc?.id));
};
/**
 * Field access for quizzes, which belong to a course through the lessons that include them.
 */ export const isAdminOrAuthorOrEnrolledInQuizCourseFieldLevel = async ({ doc, req })=>{
    if (!req.user) {
        return false;
    }
    if (checkRole([
        'admin',
        'author'
    ], req.user)) {
        return true;
    }
    if (!doc?.id) {
        return false;
    }
    const { docs: lessons } = await req.payload.find({
        collection: asSlug(getSlugs(req).lessons),
        depth: 0,
        pagination: false,
        req,
        where: {
            quizzes: {
                in: [
                    doc.id
                ]
            }
        }
    });
    return isEnrolledInCourseWithLessons(req, lessons.map((lesson)=>lesson.id));
};

//# sourceMappingURL=isAdminOrAuthorOrEnrolledInCourse.js.map