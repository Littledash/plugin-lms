import type { Access, FieldAccess, PayloadRequest } from 'payload';
import { type ID } from '../services/shared.js';
/**
 * IDs of the courses the logged-in user is enrolled in, directly, through a group, or as a
 * completed student. Cached per request so field-level checks query once.
 */
export declare const getEnrolledCourseIds: (req: PayloadRequest) => Promise<Set<string>>;
/**
 * Collection access for lessons, topics and courses.
 *
 * A read has no `data.course`. With an id, this loads the stored document. A list is limited to
 * enrolled courses and the lessons those courses contain.
 */
export declare const isAdminOrAuthorOrEnrolledInCourse: Access;
/**
 * Field access for documents with a `course` relationship (e.g. lessons, topics). Lessons without
 * one are matched through the courses that list them. Release, order and expiry apply.
 */
export declare const isAdminOrAuthorOrEnrolledInCourseFieldLevel: FieldAccess;
/**
 * Field access for fields on the course document itself.
 */
export declare const isAdminOrAuthorOrEnrolledInThisCourseFieldLevel: FieldAccess;
/**
 * Field access for quizzes, which belong to a course through the lessons that include them.
 */
export declare const isAdminOrAuthorOrEnrolledInQuizCourseFieldLevel: FieldAccess;
/**
 * IDs of the course files the logged-in user can open right now: the downloadable files of
 * lessons they can open (enrolled, access not expired, released, and earlier lessons done in
 * linear courses). Cached per request.
 */
export declare const getOpenCourseFileIds: (req: PayloadRequest) => Promise<ID[]>;
/**
 * Course files: admins and authors, or students who can open a lesson that offers the file.
 * Applies to single reads, lists and file downloads.
 */
export declare const isAdminOrAuthorOrCanOpenCourseFile: Access;
