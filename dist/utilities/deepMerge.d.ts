import type { Field } from 'payload';
/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export declare function isObject(item: unknown): item is object;
/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export declare function deepMerge<T, R>(target: T, source: R): T;
/**
 * Merges two arrays of fields, intelligently combining field configurations
 * @param existingFields - The existing fields array
 * @param newFields - The new fields to merge
 * @returns Merged fields array with field configurations properly merged
 */
export declare const mergeFields: (existingFields: Field[], newFields: Field[]) => Field[];
