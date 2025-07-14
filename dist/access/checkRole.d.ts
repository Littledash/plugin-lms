import type { User } from 'payload';
/**
 * Utility function to check if a user has any of the specified roles
 * @param allRoles - Array of role values to check against (defaults to empty array)
 * @param user - The user to check roles for (can be null)
 * @returns True if the user has any of the specified roles, false otherwise
 */
export declare const checkRole: (allRoles: User["roles"] | undefined, user: User | null) => boolean;
