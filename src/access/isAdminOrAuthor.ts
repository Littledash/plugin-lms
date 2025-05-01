import type { Access, FieldAccess, Where } from 'payload'

import type { User } from 'payload'

import { checkRole } from './checkRole.js'

/**
 * Access control for Course based on the user's role and the query string
 */
export const isAdminOrAuthor: Access = ({ req, req: { user } }) => {
   // Return true or false based on if the user has an admin role
   return Boolean(checkRole(['admin', 'author'], user))
}