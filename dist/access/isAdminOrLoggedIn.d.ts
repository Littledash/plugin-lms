import type { Access, FieldAccess } from 'payload'
import type { User } from 'payload'
/**
 * Access control that allows users with admin role or any logged-in user
 * @returns True if the user is an admin or is logged in, false otherwise
 */
export declare const isAdminOrLoggedIn: Access
export declare const isAdminOrLoggedInFieldLevel: FieldAccess<
  {
    id: string
  },
  User
>
