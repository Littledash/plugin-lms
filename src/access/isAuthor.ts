import type { Access, FieldAccess, User } from 'payload'

import { checkRole } from './checkRole.js'

/**
 * Access control for Course based on the user's role and the query string
 */
export const isAuthor: Access = ({ req, req: { user } }) => {
   // Return true or false based on if the user has an admin role
   return Boolean(checkRole(['author'], user))
}

export const isAuthorFieldLevel: FieldAccess<{ id: string }, User> = ({ req: { user } }) => {
   // Return true or false based on if the user has an admin role
   return Boolean(checkRole(['author'], user))
 }
    