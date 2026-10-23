import type { Endpoint } from 'payload';
/**
 * Self-enrollment for the logged-in user in open or free courses. Paid and group enrollments
 * must go through the server-side `enrollUser` service after the purchase is verified.
 */
export declare const enrollHandler: (_args?: Record<string, unknown>) => Endpoint["handler"];
