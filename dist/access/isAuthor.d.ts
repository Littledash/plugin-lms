import type { Access, FieldAccess, User } from 'payload';
/**
 * Access control that only allows users with author role
 * @returns True if the user has author role, false otherwise
 */
export declare const isAuthor: Access;
export declare const isAuthorFieldLevel: FieldAccess<{
    id: string;
}, User>;
