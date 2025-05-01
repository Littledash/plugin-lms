import type { Access, AccessArgs, FieldAccess } from 'payload'

import type { User } from 'payload'

import { checkRole } from './checkRole.js'

export const isAdminOrLoggedIn: Access = ({ req: { user } }: AccessArgs<User>) => {
  if (user && checkRole(['admin'], user)) {
    return true
  }

  return !!user
}
export const isAdminOrLoggedInFieldLevel: FieldAccess<{ id: string }, User> = ({
  req: { user },
  id,
}) => {
  if (checkRole(['admin'], user)) return true
  return false
}
