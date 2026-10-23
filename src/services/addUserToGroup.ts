import type { PayloadRequest } from 'payload'

import { asSlug, findDoc, getSlugs, type ID, includesId, LMSError, toIds, withTransaction } from './shared.js'

type AddUserToGroupArgs = {
  groupId: ID
  req: PayloadRequest
  role: 'leader' | 'student'
  userId: ID
}

/**
 * Adds a user to a group as a leader or student. Does not check who is asking; the endpoint
 * checks that the requester is an admin or a leader of the group.
 */
export const addUserToGroup = ({ groupId, req, role, userId }: AddUserToGroupArgs): Promise<void> =>
  withTransaction(req, async () => {
    if (role !== 'leader' && role !== 'student') {
      throw new LMSError('Role must be either "leader" or "student".', 400)
    }

    const slugs = getSlugs(req)
    const user = await findDoc(req, slugs.students, userId, 'User')
    const group = await findDoc(req, slugs.groups, groupId, 'Group')
    const field = role === 'leader' ? 'leaders' : 'students'
    const members = toIds(group[field])

    if (includesId(members, user.id)) {
      throw new LMSError(`User is already a ${role} in this group.`, 409)
    }

    await req.payload.update({
      id: group.id,
      collection: asSlug(slugs.groups),
      data: { [field]: [...members, user.id] },
      req,
    })

    req.payload.logger.info(`User ${user.id} added to group ${group.id} as ${role}`)
  })
