import type { Access } from 'payload'
import { checkRole } from './checkRole.js'

/**
 * Access control that allows users with admin role or published status
 * @returns True if the user is an admin or published, false otherwise
 */
export const isAdminOrPublished: Access = ({ req: { user } }) => {
  if (checkRole(['admin'], user)) {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}
