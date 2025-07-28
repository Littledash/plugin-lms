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
