import { checkRole } from './checkRole.js'
/**
 * Access control that allows users with admin role or student role
 * @returns True if the user is an admin or student, false otherwise
 */ export const isAdminOrAuthorOrStudent = ({ req: { user } }) => {
  if (user && checkRole(['admin', 'author', 'student'], user)) {
    return true
  }
  return false
}
export const isAdminOrAuthorOrStudentFieldLevel = ({ req: { user }, doc }) => {
  if (!user) return false
  if (checkRole(['admin', 'author'], user)) return true
  return doc?.students?.includes(String(user.id)) ?? false
}

//# sourceMappingURL=isAdminOrAuthorOrStudent.js.map
