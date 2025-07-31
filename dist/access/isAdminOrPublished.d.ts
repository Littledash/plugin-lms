import type { Access } from 'payload'
/**
 * Access control that allows users with admin role or published status
 * @returns True if the user is an admin or published, false otherwise
 */
export declare const isAdminOrPublished: Access
