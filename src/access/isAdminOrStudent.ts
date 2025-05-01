import type { Access, FieldAccess } from 'payload'

import type { User } from 'payload'

import { checkRole } from './checkRole.js'

/**
 * Access control for Course based on the user's role and the query string
 */
export const isAdminOrStudent: Access = ({ req, req: { user } }) => {
  if (user && checkRole(['admin', 'author'], user)) {
    return true
  }

  return {
    students: {
      contains: user?.id,
    },
  }
}


export const isAdminOrStudentFieldLevel: FieldAccess<{ id: string; students?: (string | number)[] }, User> = ({
  req: { user },
  doc,
}) => {
  if (!user) return false
  if (checkRole(['admin', 'author'], user)) return true
  return doc?.students?.includes(String(user.id)) ?? false
}