import type { Access, TypedCollection, Where } from 'payload'
import { checkRole } from './checkRole.js'

export const isMemberOfGroup: Access = async ({ req, id }) => {
  const { user } = req

  if (!user) {
    return false
  }

  if (checkRole(['admin'], user)) {
    return true
  }

  if (id) {
    const group = await req.payload.findByID({
      collection: 'groups',
      id,
      depth: 1,
    })

    if (group) {
      const userIds = group.users?.map(( member: TypedCollection['users']) => typeof member === 'object' ? member.id : member) || []
      const leaderIds = group.leaders?.map((leader: TypedCollection['users']) => typeof leader === 'object' ? leader.id : leader) || []

      if (userIds.includes(user.id) || leaderIds.includes(user.id)) {
        return true
      }
    }
  }

  // A query to find groups a user is in
  const query: Where = {
    or: [
      {
        users: {
          in: [user.id],
        },
      },
      {
        leaders: {
          in: [user.id],
        },
      }
    ]
  }
  return query
  
}
