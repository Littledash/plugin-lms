import type { Endpoint } from 'payload'

import { checkRole } from '../access/checkRole.js'
import { addUserToGroup } from '../services/addUserToGroup.js'
import { findDoc, getSlugs, includesId, LMSError, toIds } from '../services/shared.js'
import { lmsHandler, requireId } from './handler.js'

/**
 * Lets an admin or a leader of the group add another user to it. The user being added is
 * `memberId`; the requester is always the logged-in user.
 */
export const addUserToGroupHandler = (_args?: Record<string, unknown>): Endpoint['handler'] =>
  lmsHandler(async ({ data, req, userId }) => {
    const groupId = requireId(data, 'groupId')
    const memberId = requireId(data, 'memberId')
    const { role } = data
    if (role !== 'leader' && role !== 'student') {
      throw new LMSError('Role must be either "leader" or "student".', 400)
    }

    const group = await findDoc(req, getSlugs(req).groups, groupId, 'Group')
    if (!checkRole(['admin'], req.user) && !includesId(toIds(group.leaders), userId)) {
      throw new LMSError('You are not authorized to add users to this group.', 403)
    }

    await addUserToGroup({ groupId: group.id, req, role, userId: memberId })
    return Response.json({ message: `Successfully added user to group as ${role}.`, success: true })
  })
