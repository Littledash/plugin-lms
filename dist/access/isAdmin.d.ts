import type { AccessArgs, FieldAccess } from 'payload'
import type { User } from 'payload'
type isAdminType = (args: AccessArgs<User>) => boolean
/**
 * Access control that only allows users with admin role
 * @returns True if the user has admin role, false otherwise
 */
export declare const isAdmin: isAdminType
export declare const isAdminFieldLevel: FieldAccess<
  {
    id: string
  },
  User
>
export {}
