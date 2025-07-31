import type { Access, FieldAccess } from 'payload'
/**
 * Access control that allows users with admin role or author role
 * @returns True if the user is an admin or author, false otherwise
 */
export declare const isAdminOrAuthor: Access
/**
 * Access control that allows users with admin role or author role
 * @returns True if the user is an admin or author, false otherwise
 */
export declare const isAdminOrAuthorFieldLevel: FieldAccess
