import type { Access, Where } from 'payload'

import { type ID, includesId } from '../services/shared.js'
import { checkRole } from './checkRole.js'
import { findGroup } from './findGroup.js'

const memberQuery = (userId: ID): Where => ({
  or: [{ students: { in: [userId] } }, { leaders: { in: [userId] } }],
})

export const isMemberOfGroup: Access = async ({ id, req }) => {
  const { user } = req

  if (!user) {
    return false
  }

  if (checkRole(['admin'], user)) {
    return true
  }

  if (id) {
    const group = await findGroup(req, id)
    if (!group) {return false}
    return includesId(group.students || [], user.id) || includesId(group.leaders || [], user.id)
  }

  return memberQuery(user.id)
}
