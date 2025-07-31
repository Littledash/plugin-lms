import { checkRole } from './checkRole.js'
/**
 * Access control that allows users with admin role or any logged-in user
 * @returns True if the user is an admin or is logged in, false otherwise
 */ export const isAdminOrLoggedIn = ({ req: { user } }) => {
  if (user && checkRole(['admin'], user)) {
    return true
  }
  return Boolean(user)
}
export const isAdminOrLoggedInFieldLevel = ({ req: { user }, id }) => {
  if (checkRole(['admin'], user)) return true
  return false
}

//# sourceMappingURL=isAdminOrLoggedIn.js.map
