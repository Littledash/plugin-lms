import type { Access, FieldAccess } from 'payload';
/**
 * Access control that allows users with admin role or author role or enrolled in course
 * @returns True if the user is an admin or author or enrolled in course, false otherwise
 */
export declare const isAdminOrAuthorOrEnrolledInCourse: Access;
export declare const isAdminOrAuthorOrEnrolledInCourseFieldLevel: FieldAccess;
