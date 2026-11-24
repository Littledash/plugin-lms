import type { PayloadRequest, Where } from 'payload'

import { renewAccess } from './lessonAccess.js'
import { clearRevocations, groupMemberIds } from './revocations.js'
import {
  asSlug,
  type CourseProgressEntry,
  ensureCourseProgress,
  findDoc,
  getCoursesProgress,
  getSlugs,
  hasFreeSeat,
  type ID,
  includesId,
  isActivePurchase,
  type LMSDoc,
  LMSError,
  sameId,
  toId,
  toIds,
  withTransaction,
} from './shared.js'

export type GroupEnrollment = {
  /** Title for a new group. Never used to join an existing group. */
  companyName?: null | string
  /** Joins the group that purchased the course with this coupon. */
  couponId?: ID | null
  isLeader?: boolean
  totalSeats?: number
}

type EnrollUserArgs = {
  courseId: ID
  group?: GroupEnrollment
  /**
   * Start a new access period when the user already has this course, for example when an
   * expired student buys it again. Only pass it for a verified purchase. `key` identifies the
   * purchase (an order id): a second call with the same key does nothing, so webhook retries and
   * several fulfilment paths cannot add extra periods.
   */
  renewal?: { key: string }
  req: PayloadRequest
  userId: ID
}

export type EnrollUserResult = {
  groupId?: ID
  status: 'already-completed' | 'already-enrolled' | 'already-renewed' | 'enrolled' | 'renewed'
}

const findExistingGroup = async (
  req: PayloadRequest,
  userId: ID,
  { companyName, couponId }: GroupEnrollment,
): Promise<LMSDoc | undefined> => {
  const where: Where = couponId
    ? { 'purchasedCourses.seatManagement.coupon': { equals: couponId } }
    : {
        and: [
          { leaders: { in: [userId] } },
          ...(companyName ? [{ title: { equals: companyName } }] : []),
        ],
      }

  const { docs } = await req.payload.find({
    collection: asSlug(getSlugs(req).groups),
    depth: 0,
    limit: 1,
    req,
    where,
  })
  return docs[0] as LMSDoc | undefined
}

const enrollGroup = async ({
  course,
  group: groupArgs,
  req,
  user,
}: {
  course: LMSDoc
  group: GroupEnrollment
  req: PayloadRequest
  user: LMSDoc
}): Promise<ID> => {
  const slugs = getSlugs(req)
  const { companyName, couponId = null, isLeader = false, totalSeats = 1 } = groupArgs
  const memberField = isLeader ? 'leaders' : 'students'
  let group = await findExistingGroup(req, user.id, groupArgs)

  if (group) {
    const members = toIds(group[memberField])
    const isNewMember = !includesId(members, user.id)
    const purchasedCourses: LMSDoc[] = Array.isArray(group.purchasedCourses)
      ? group.purchasedCourses
      : []
    const purchase = purchasedCourses.find((entry) =>
      sameId(entry?.seatManagement?.course, course.id),
    )

    const restoring = purchase !== undefined && !isActivePurchase(purchase)
    if (restoring && !isLeader) {
      throw new LMSError('This group purchase is no longer active.', 403)
    }

    const data: Record<string, unknown> = {}
    if (purchase && !restoring && isNewMember && !hasFreeSeat(purchase.seatManagement)) {
      throw new LMSError('This group has no seats remaining for this course.', 409)
    }
    if (isNewMember) {
      data[memberField] = [...members, user.id]
    }
    if (restoring) {
      // A new purchase by a leader of a group whose purchase was refunded: the group gets the
      // course back with the seats just bought
      data.purchasedCourses = purchasedCourses.map((entry) =>
        entry === purchase
          ? {
              ...entry,
              seatManagement: {
                ...entry.seatManagement,
                revokedAt: null,
                revokedReason: null,
                seatsTotal: totalSeats,
                seatsUsed: (entry.seatManagement.seatsUsed || 0) + (isNewMember ? 1 : 0),
              },
            }
          : entry,
      )
    } else if (!purchase) {
      data.purchasedCourses = [
        ...purchasedCourses,
        { seatManagement: { coupon: couponId, course: course.id, seatsTotal: totalSeats, seatsUsed: 1 } },
      ]
    } else if (isNewMember) {
      data.purchasedCourses = purchasedCourses.map((entry) =>
        entry === purchase
          ? {
              ...entry,
              seatManagement: {
                ...entry.seatManagement,
                seatsUsed: (entry.seatManagement.seatsUsed || 0) + 1,
              },
            }
          : entry,
      )
    }

    if (Object.keys(data).length > 0) {
      group = (await req.payload.update({
        id: group.id,
        collection: asSlug(slugs.groups),
        data,
        req,
      })) as LMSDoc
    }
    if (restoring) {
      // The buyer is restored by `enrollUser` itself
      await clearRevocations({ courseId: course.id, req, userIds: groupMemberIds(group).filter((id) => !sameId(id, user.id)) })
    }
  } else {
    if (!companyName) {
      throw new LMSError('Company name is required to create a new group.', 400)
    }
    group = (await req.payload.create({
      collection: asSlug(slugs.groups),
      data: {
        [memberField]: [user.id],
        purchasedCourses: [
          { seatManagement: { coupon: couponId, course: course.id, seatsTotal: totalSeats, seatsUsed: 1 } },
        ],
        title: companyName,
      },
      req,
    })) as LMSDoc
    req.payload.logger.info(`Created group ${group.id} for course ${course.id}`)
  }

  const enrolledGroups = toIds(course.courseEnrolledGroups)
  if (!includesId(enrolledGroups, group.id)) {
    await req.payload.update({
      id: course.id,
      collection: asSlug(slugs.courses),
      data: { courseEnrolledGroups: [...enrolledGroups, group.id] },
      req,
    })
  }

  const roles: string[] = Array.isArray(user.roles) ? user.roles : []
  if (isLeader && !roles.includes('leader')) {
    await req.payload.update({
      id: user.id,
      collection: asSlug(slugs.students),
      data: { roles: [...roles, 'leader'] },
      req,
    })
  }

  return group.id
}

const MAX_RENEWAL_KEY_LENGTH = 200

const requireRenewalKey = (key: unknown): string => {
  if (typeof key !== 'string' || key.trim() === '' || key.length > MAX_RENEWAL_KEY_LENGTH) {
    throw new LMSError('renewal.key must be a non-empty string identifying the purchase.', 400)
  }
  return key
}

const hasRenewal = (progress: CourseProgressEntry, key: string) =>
  (progress.renewals ?? []).some((entry) => entry.key === key)

const recordRenewal = (progress: CourseProgressEntry, key: string) => {
  progress.renewals = [...(progress.renewals ?? []), { key, renewedAt: new Date().toISOString() }]
}

/**
 * Enrolls a user in a course, optionally through a group purchase.
 *
 * This is a trusted server-side operation: it does not check payment. Call it only after the
 * purchase has been verified, with a `userId` taken from trusted server state.
 */
export const enrollUser = ({
  courseId,
  group,
  renewal,
  req,
  userId,
}: EnrollUserArgs): Promise<EnrollUserResult> =>
  withTransaction(req, async () => {
    const renewalKey = renewal === undefined ? undefined : requireRenewalKey(renewal.key)
    const slugs = getSlugs(req)
    const user = await findDoc(req, slugs.students, userId, 'User')
    // The group step may update the course, so read it again afterwards
    let course = await findDoc(req, slugs.courses, courseId, 'Course')

    // A retried fulfilment of a purchase that was since refunded must not give access back, to
    // the user or (through the group step) to their group
    const priorProgress = getCoursesProgress(user).find((progress) => sameId(progress.course, course.id))
    if (renewalKey !== undefined && priorProgress?.revokedAt && hasRenewal(priorProgress, renewalKey)) {
      return { status: 'already-renewed' }
    }

    const groupId = group ? await enrollGroup({ course, group, req, user }) : undefined
    if (groupId !== undefined) {
      course = await findDoc(req, slugs.courses, courseId, 'Course')
    }

    const coursesProgress = getCoursesProgress(user)
    const hadProgress = coursesProgress.some((progress) => sameId(progress.course, course.id))
    const saveProgress = async () => {
      await req.payload.update({
        id: user.id,
        collection: asSlug(slugs.students),
        data: { coursesProgress },
        req,
      })
    }

    const isEnrolled = includesId(toIds(course.enrolledStudents), user.id)
    const hasCompleted = includesId(toIds(course.courseCompletedStudents), user.id)
    const existing = coursesProgress.find((progress) => sameId(progress.course, course.id))
    // Listed on the course again (an admin re-added them), so the revocation no longer applies
    if ((isEnrolled || hasCompleted) && existing?.revokedAt) {
      existing.revokedAt = null
      existing.revokedReason = null
      await saveProgress()
    }
    if ((isEnrolled || hasCompleted) && renewalKey !== undefined) {
      const progress = ensureCourseProgress(coursesProgress, course.id)
      if (hasRenewal(progress, renewalKey)) {
        return { groupId, status: 'already-renewed' }
      }
      renewAccess(course, progress)
      recordRenewal(progress, renewalKey)
      await saveProgress()
      req.payload.logger.info(`User ${user.id} renewed access to course ${toId(course)}`)
      return { groupId, status: 'renewed' }
    }
    if (isEnrolled) {
      if (!hadProgress) {
        ensureCourseProgress(coursesProgress, course.id)
        await saveProgress()
      }
      return { groupId, status: 'already-enrolled' }
    }
    if (hasCompleted) {
      return { groupId, status: 'already-completed' }
    }

    const revoked = existing?.revokedAt ? existing : undefined

    // A student whose access was revoked after finishing goes back to the completed list, so the
    // course is not completed (and its certificate awarded) a second time
    const listField = revoked?.completed ? 'courseCompletedStudents' : 'enrolledStudents'
    await req.payload.update({
      id: course.id,
      collection: asSlug(slugs.courses),
      data: { [listField]: [...toIds(course[listField]), user.id] },
      req,
    })
    const progress = ensureCourseProgress(coursesProgress, course.id)
    if (revoked) {
      // The refunded period is gone; this purchase starts a new one
      revoked.accessFrom = new Date().toISOString()
      revoked.revokedAt = null
      revoked.revokedReason = null
    }
    // A retry of this purchase must not later count as a renewal
    if (renewalKey !== undefined) {
      recordRenewal(progress, renewalKey)
    }
    if (!hadProgress || revoked || renewalKey !== undefined) {
      await saveProgress()
    }

    req.payload.logger.info(`User ${user.id} enrolled in course ${toId(course)}`)
    return { groupId, status: 'enrolled' }
  })

/**
 * Access modes a user can enroll in themselves without a purchase.
 */
export const SELF_ENROLL_ACCESS_MODES = ['open', 'free']

