import type { User } from 'payload'

/**
 * Utility function to check if a user has any of the specified roles
 * @param allRoles - Array of role values to check against (defaults to empty array)
 * @param user - The user to check roles for (can be null)
 * @returns True if the user has any of the specified roles, false otherwise
 */
export const checkRole = (allRoles: User['roles'] = [], user: User | null): boolean => {
  if (user) {
    if (
      allRoles.some((role: string) => {
        return user?.roles?.some((individualRole: string) => {
          return individualRole === role
        })
      })
    )
      return true
  }

  return false
}
