import type { Access, FieldAccess } from 'payload'

import type { User } from 'payload'

import { checkRole } from './checkRole.js'

/**
 * Access control that allows users with admin role or student role
 * @returns True if the user is an admin or student, false otherwise
 */
export const isAdminOrAuthorOrStudent: Access = ({ req: { user } }) => {
  if (user && checkRole(['admin', 'author', 'student'], user)) {
    return true
  }

  return false
}


export const isAdminOrAuthorOrStudentFieldLevel: FieldAccess<{ id: string; students?: (string | number)[] }, User> = ({
  req: { user },
  doc,
}) => {
  if (!user) return false
  if (checkRole(['admin', 'author', 'student'], user)) return true
  return doc?.students?.includes(String(user.id)) ?? false
}