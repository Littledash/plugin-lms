import {
  APIError,
  commitTransaction,
  type DefaultDocumentIDType,
  initTransaction,
  killTransaction,
  type PayloadRequest,
} from 'payload'

import type { CollectionSlugMap } from '../types.js'

import { defaultCollectionSlugMap } from '../utilities/getCollectionSlugMap.js'

/**
 * The plugin cannot know the consumer's generated types, so documents are loosely typed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LMSDoc = { [key: string]: any; id: DefaultDocumentIDType }

export type ID = DefaultDocumentIDType

type Relation = { id: ID } | ID | null | undefined

export type CourseProgressEntry = {
  completed?: boolean | null
  completedAt?: null | string
  completedLessons: { completedAt: string; lesson: ID }[]
  completedQuizzes: {
    attempts?: null | number
    completedAt: string
    lastAttemptAt?: null | string
    quiz: ID
    score: number
  }[]
  course: ID
}

/**
 * An error whose message is safe to return to the client.
 */
export class LMSError extends APIError {
  constructor(message: string, status: number) {
    super(message, status, null, true)
  }
}

export const toId = (value: Relation): ID | undefined => {
  if (value == null) {return undefined}
  if (typeof value !== 'object') {return value}

  const record = value as { _bsontype?: unknown; id?: Relation }
  // An ObjectId also has an `id` property, but that is raw bytes, not the document id.
  if (record._bsontype === 'ObjectId') {return value as unknown as ID}
  if (record.id != null) {return toId(record.id)}
  return value as unknown as ID
}

export const toIds = (values: unknown): ID[] =>
  Array.isArray(values)
    ? values.map((value) => toId(value as Relation)).filter((id): id is ID => id !== undefined)
    : []

/**
 * Compares IDs as strings so ObjectId instances and string IDs match.
 */
export const sameId = (a: Relation, b: Relation): boolean => {
  const idA = toId(a)
  const idB = toId(b)
  return idA !== undefined && idB !== undefined && String(idA) === String(idB)
}

export const includesId = (ids: Relation[], id: Relation): boolean =>
  ids.some((candidate) => sameId(candidate, id))

export const getSlugs = (req: PayloadRequest): CollectionSlugMap => ({
  ...defaultCollectionSlugMap,
  ...(req.payload.config.custom?.lms?.slugs as Partial<CollectionSlugMap> | undefined),
})

export const asSlug = (slug: string) => slug

/**
 * Runs `fn` inside a transaction, reusing one already open on `req`.
 */
export const withTransaction = async <T>(req: PayloadRequest, fn: () => Promise<T>): Promise<T> => {
  const shouldCommit = await initTransaction(req)
  try {
    const result = await fn()
    if (shouldCommit) {
      await commitTransaction(req)
    }
    return result
  } catch (error) {
    if (shouldCommit) {
      await killTransaction(req)
    }
    throw error
  }
}

export const findDoc = async (
  req: PayloadRequest,
  collection: string,
  id: ID,
  label: string,
): Promise<LMSDoc> => {
  const doc = await req.payload.findByID({
    id,
    collection: asSlug(collection),
    depth: 0,
    disableErrors: true,
    req,
  })
  if (!doc) {
    throw new LMSError(`${label} not found.`, 404)
  }
  return doc as LMSDoc
}

/**
 * Normalises the user's progress to IDs so it can be compared and saved back.
 */
export const getCoursesProgress = (user: LMSDoc): CourseProgressEntry[] =>
  (Array.isArray(user.coursesProgress) ? user.coursesProgress : []).map(
    (progress: CourseProgressEntry & LMSDoc) => ({
      ...progress,
      completedLessons: (progress.completedLessons || []).map((entry) => ({
        ...entry,
        lesson: toId(entry.lesson) as ID,
      })),
      completedQuizzes: (progress.completedQuizzes || []).map((entry) => ({
        ...entry,
        quiz: toId(entry.quiz) as ID,
      })),
      course: toId(progress.course) as ID,
    }),
  )

/**
 * Returns the progress entry for a course, adding an empty one when missing.
 */
export const ensureCourseProgress = (
  coursesProgress: CourseProgressEntry[],
  courseId: ID,
): CourseProgressEntry => {
  let progress = coursesProgress.find((entry) => sameId(entry.course, courseId))
  if (!progress) {
    progress = { completed: false, completedLessons: [], completedQuizzes: [], course: courseId }
    coursesProgress.push(progress)
  }
  return progress
}

export const getCourseLessonIds = (course: LMSDoc, { requiredOnly = false } = {}): ID[] =>
  (Array.isArray(course.lessons) ? course.lessons : [])
    .filter((item: LMSDoc) => !requiredOnly || !item.isOptional)
    .map((item: LMSDoc) => toId(item.lesson))
    .filter((id: ID | undefined): id is ID => id !== undefined)

export const hasCompletedRequiredLessons = (course: LMSDoc, progress: CourseProgressEntry) => {
  const completedLessonIds = progress.completedLessons.map((entry) => entry.lesson)
  return getCourseLessonIds(course, { requiredOnly: true }).every((lessonId) =>
    includesId(completedLessonIds, lessonId),
  )
}

/**
 * A user is enrolled when they are listed on the course directly, have completed it,
 * or belong to a group enrolled in it.
 */
export const isEnrolledInCourse = async (
  req: PayloadRequest,
  course: LMSDoc,
  userId: ID,
): Promise<boolean> => {
  if (
    includesId(toIds(course.enrolledStudents), userId) ||
    includesId(toIds(course.courseCompletedStudents), userId)
  ) {
    return true
  }

  const groupIds = toIds(course.courseEnrolledGroups)
  if (groupIds.length === 0) {
    return false
  }

  const { totalDocs } = await req.payload.count({
    collection: asSlug(getSlugs(req).groups),
    req,
    where: {
      and: [
        { id: { in: groupIds } },
        { or: [{ students: { in: [userId] } }, { leaders: { in: [userId] } }] },
      ],
    },
  })
  return totalDocs > 0
}

export const requireUser = (req: PayloadRequest): ID => {
  if (!req.user) {
    throw new LMSError('You must be logged in.', 401)
  }
  return req.user.id
}

type SeatManagement = { seatsTotal?: null | number; seatsUsed?: null | number } | undefined

export const hasFreeSeat = (seatManagement: SeatManagement): boolean =>
  (seatManagement?.seatsUsed || 0) < (seatManagement?.seatsTotal ?? 1)

/**
 * Takes one seat on every course the group purchased. Throws when any of them is full.
 */
export const takeSeatOnEachPurchase = (purchasedCourses: LMSDoc[]): LMSDoc[] => {
  if (purchasedCourses.some((entry) => !hasFreeSeat(entry?.seatManagement))) {
    throw new LMSError('This group has no seats remaining.', 409)
  }
  return purchasedCourses.map((entry) => ({
    ...entry,
    seatManagement: { ...entry.seatManagement, seatsUsed: (entry.seatManagement?.seatsUsed || 0) + 1 },
  }))
}
