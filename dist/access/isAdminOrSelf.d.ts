import type { Access, FieldAccess, User } from 'payload';
/**
 * Access control that allows users with admin role or self
 * @returns True if the user is an admin or self, false otherwise
 */
export declare const isAdminOrSelf: Access;
export declare const isAdminOrSelfFieldLevel: FieldAccess<{
    id: string;
}, User>;
