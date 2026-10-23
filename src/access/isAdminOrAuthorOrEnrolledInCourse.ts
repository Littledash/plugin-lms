import type { Access, AccessResult, FieldAccess, PayloadRequest, Where } from 'payload'

import { isAccessExpired, lessonBlockReason } from '../services/lessonAccess.js'
import { asSlug, getSlugs, getUserProgress, type ID, type LMSDoc, sameId, toId, toIds } from '../services/shared.js'
import { checkRole } from './checkRole.js'

const enrolledCourseIdsCache = new WeakMap<PayloadRequest, Promise<Set<string>>>()

/**
 * IDs of the courses the logged-in user is enrolled in, directly, through a group, or as a
 * completed student. Cached per request so field-level checks query once.
 */
export const getEnrolledCourseIds = (req: PayloadRequest): Promise<Set<string>> => {
  let enrolledCourseIds = enrolledCourseIdsCache.get(req)
  if (!enrolledCourseIds) {
    enrolledCourseIds = (async () => {
      const userId = req.user?.id
      if (userId === undefined) {
        return new Set<string>()
      }
      const slugs = getSlugs(req)
      const { docs: groups } = await req.payload.find({
        collection: asSlug(slugs.groups),
        depth: 0,
        pagination: false,
        req,
        where: { or: [{ students: { in: [userId] } }, { leaders: { in: [userId] } }] },
      })
      const groupIds = groups.map((group) => group.id)

      const { docs: courses } = await req.payload.find({
        collection: asSlug(slugs.courses),
        depth: 0,
        pagination: false,
        req,
        where: {
          or: [
            { enrolledStudents: { in: [userId] } },
            { courseCompletedStudents: { in: [userId] } },
            ...(groupIds.length > 0 ? [{ courseEnrolledGroups: { in: groupIds } }] : []),
          ],
        },
      })
      return new Set(courses.map((course) => String(course.id)))
    })()
    enrolledCourseIdsCache.set(req, enrolledCourseIds)
  }
  return enrolledCourseIds
}

const isEnrolledIn = async (req: PayloadRequest, courseId: ID | undefined) =>
  courseId !== undefined && (await getEnrolledCourseIds(req)).has(String(courseId))

/**
 * Whether any enrolled course lists one of these lessons. Courses own the lesson order in their
 * `lessons` array, so this works even when a lesson's own `course` field is not set.
 */
const isEnrolledInCourseWithLessons = async (req: PayloadRequest, lessonIds: ID[]) => {
  const enrolledCourseIds = [...(await getEnrolledCourseIds(req))]
  if (enrolledCourseIds.length === 0 || lessonIds.length === 0) {return false}

  const { totalDocs } = await req.payload.count({
    collection: asSlug(getSlugs(req).courses),
    req,
    where: {
      and: [{ id: { in: toIds(enrolledCourseIds) } }, { 'lessons.lesson': { in: lessonIds } }],
    },
  })
  return totalDocs > 0
}

const lessonIdsOnEnrolledCourses = async (req: PayloadRequest): Promise<ID[]> => {
  const enrolledCourseIds = [...(await getEnrolledCourseIds(req))]
  if (enrolledCourseIds.length === 0) {return []}

  const { docs } = await req.payload.find({
    collection: asSlug(getSlugs(req).courses),
    depth: 0,
    pagination: false,
    req,
    where: { id: { in: toIds(enrolledCourseIds) } },
  })

  return docs.flatMap((course) => {
    const lessons = (course as LMSDoc).lessons
    if (!Array.isArray(lessons)) {return []}
    return lessons
      .map((entry: LMSDoc) => toId(entry.lesson ?? entry))
      .filter((lessonId): lessonId is ID => lessonId !== undefined)
  })
}

/**
 * Collection access for lessons, topics and courses.
 *
 * A read has no `data.course`. With an id, this loads the stored document. A list is limited to
 * enrolled courses and the lessons those courses contain.
 */
export const isAdminOrAuthorOrEnrolledInCourse: Access = async ({
  id,
  collectionConfig,
  data,
  req,
}): Promise<AccessResult> => {
  if (!req.user) {return false}
  if (checkRole(['admin', 'author'], req.user)) {return true}

  const slug = collectionConfig?.slug
  if (id !== undefined && slug) {
    const doc = await req.payload.findByID({
      id,
      collection: asSlug(slug),
      depth: 0,
      disableErrors: true,
      overrideAccess: true,
      req,
    })
    if (!doc) {return false}
    const record = doc as LMSDoc
    const slugs = getSlugs(req)
    const courseId = toId(record.course)
    if (courseId !== undefined) {return isEnrolledIn(req, courseId)}
    if (slug === slugs.courses) {return isEnrolledIn(req, record.id)}
    if (slug === slugs.lessons) {return isEnrolledInCourseWithLessons(req, [record.id])}
    const lessonId = toId(record.lesson)
    return lessonId !== undefined && isEnrolledInCourseWithLessons(req, [lessonId])
  }

  const requestedCourse = toId(data?.course)
  if (requestedCourse !== undefined) {return isEnrolledIn(req, requestedCourse)}

  const enrolled = [...(await getEnrolledCourseIds(req))]
  const lessonIds = await lessonIdsOnEnrolledCourses(req)
  if (enrolled.length === 0 && lessonIds.length === 0) {return false}

  const slugs = getSlugs(req)
  if (slug === slugs.courses) {return { id: { in: enrolled } }}
  if (slug === slugs.lessons || slug === slugs.topics) {
    const or: Where[] = []
    if (enrolled.length > 0) {or.push({ course: { in: enrolled } })}
    if (lessonIds.length > 0) {
      or.push(slug === slugs.lessons ? { id: { in: lessonIds } } : { lesson: { in: lessonIds } })
    }
    return { or }
  }
  return enrolled.length > 0 ? { course: { in: enrolled } } : false
}

const lessonAvailableCache = new WeakMap<PayloadRequest, Map<string, Promise<boolean>>>()

const loadLesson = async (req: PayloadRequest, lessonId: ID): Promise<LMSDoc | null> => {
  const doc = await req.payload.findByID({
    id: lessonId,
    collection: asSlug(getSlugs(req).lessons),
    depth: 0,
    disableErrors: true,
    overrideAccess: true,
    req,
  })
  return doc ? (doc as LMSDoc) : null
}

/**
 * The lesson is open when the user is enrolled in a course that contains it, that enrollment has
 * not expired, the lesson's release date has passed, and linear courses have their earlier lessons
 * done.
 */
const lessonIsAvailable = (req: PayloadRequest, lesson: LMSDoc): Promise<boolean> => {
  let byLesson = lessonAvailableCache.get(req)
  if (!byLesson) {
    byLesson = new Map()
    lessonAvailableCache.set(req, byLesson)
  }
  const key = String(lesson.id)
  let available = byLesson.get(key)
  if (!available) {
    available = (async () => {
      const enrolledCourseIds = [...(await getEnrolledCourseIds(req))]
      if (enrolledCourseIds.length === 0) {return false}
      const directCourseId = toId(lesson.course)
      const { docs } = await req.payload.find({
        collection: asSlug(getSlugs(req).courses),
        depth: 0,
        pagination: false,
        req,
        where: {
          and: [
            { id: { in: toIds(enrolledCourseIds) } },
            {
              or: [
                { 'lessons.lesson': { in: [lesson.id] } },
                ...(directCourseId !== undefined ? [{ id: { equals: directCourseId } }] : []),
              ],
            },
          ],
        },
      })
      if (docs.length === 0) {return false}
      const progress = await getUserProgress(req)
      return (docs as LMSDoc[]).some(
        (course) =>
          lessonBlockReason({
            course,
            lesson,
            lessonId: lesson.id,
            progress: progress.find((entry) => sameId(entry.course, course.id)),
          }) === null,
      )
    })()
    byLesson.set(key, available)
  }
  return available
}

/**
 * Field access for documents with a `course` relationship (e.g. lessons, topics). Lessons without
 * one are matched through the courses that list them. Release, order and expiry apply.
 */
export const isAdminOrAuthorOrEnrolledInCourseFieldLevel: FieldAccess = async ({ doc, req }) => {
  if (!req.user) {return false}
  if (checkRole(['admin', 'author'], req.user)) {return true}
  if (!doc) {return false}
  const linkedLessonId = toId(doc.lesson)
  const lesson = linkedLessonId !== undefined ? await loadLesson(req, linkedLessonId) : (doc as LMSDoc)
  return lesson !== null && lessonIsAvailable(req, lesson)
}

/**
 * Field access for fields on the course document itself.
 */
export const isAdminOrAuthorOrEnrolledInThisCourseFieldLevel: FieldAccess = async ({ doc, req }) => {
  if (!req.user) {return false}
  if (checkRole(['admin', 'author'], req.user)) {return true}
  const courseId = toId(doc?.id)
  if (!(await isEnrolledIn(req, courseId))) {return false}
  const progress = (await getUserProgress(req)).find((entry) => sameId(entry.course, courseId))
  return !isAccessExpired(doc as LMSDoc, progress)
}

/**
 * Field access for quizzes, which belong to a course through the lessons that include them.
 */
export const isAdminOrAuthorOrEnrolledInQuizCourseFieldLevel: FieldAccess = async ({ doc, req }) => {
  if (!req.user) {return false}
  if (checkRole(['admin', 'author'], req.user)) {return true}
  if (!doc?.id) {return false}

  const { docs: lessons } = await req.payload.find({
    collection: asSlug(getSlugs(req).lessons),
    depth: 0,
    pagination: false,
    req,
    where: { quizzes: { in: [doc.id] } },
  })
  for (const lesson of lessons) {
    if (await lessonIsAvailable(req, lesson as LMSDoc)) {return true}
  }
  return false
}
