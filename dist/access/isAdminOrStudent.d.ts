import type { Access, FieldAccess } from 'payload'
import type { User } from 'payload'
/**
 * Access control that allows users with admin role or student role
 * @returns True if the user is an admin or student, false otherwise
 */
export declare const isAdminOrStudent: Access
export declare const isAdminOrStudentFieldLevel: FieldAccess<
  {
    id: string
    students?: (string | number)[]
  },
  User
>
