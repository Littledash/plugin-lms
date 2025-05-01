import type { AccessArgs, FieldAccess } from 'payload'
import type { User } from 'payload'
import { checkRole } from './checkRole.js'

type isAdminType = (args: AccessArgs<User>) => boolean

/**
 * Access control that only allows users with admin role
 * @returns True if the user has admin role, false otherwise
 */
export const isAdmin: isAdminType = ({ req: { user } }) => {
  // Return true or false based on if the user has an admin role
  return Boolean(checkRole(['admin'], user))
}

export const isAdminFieldLevel: FieldAccess<{ id: string }, User> = ({ req: { user } }) => {
  // Return true or false based on if the user has an admin role
  return Boolean(checkRole(['admin'], user))
}
