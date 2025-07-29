/**
 * Ensures that a target object has a property with a given key, initializing it with a factory function if missing.
 *
 * Use cases:
 * - Lazily initializing properties on objects
 * - Adding computed or default properties to existing objects
 * - Useful for extension patterns, caching, or dynamic property injection
 *
 * @template T - The target object type
 * @template F - The factory function type
 * @template K - The property key type
 * @template O - The enhanced object type
 * @param target - The object to enhance
 * @param key - The property key to ensure
 * @param fn - Factory function to generate the property value if missing
 * @returns The enhanced object with the ensured property
 * @source This function is useful for scenarios where you want to guarantee that an object has a certain property,
 * initializing it only if it doesn't exist. It's commonly used for lazy initialization, caching, or extending objects
 * with additional computed properties.
 *
 * @example
 * ```ts
 * // Ensure an object has a 'cache' property, initializing it if missing
 * const obj = {};
 * const withCache = ensureProperty(obj, 'cache', () => new Map());
 * // withCache.cache is now a Map instance
 * ```
 */
export function ensureProperty<
  T,
  F extends (...args: any) => any = (...args: any) => any,
  K extends string = string,
  O extends { [key in K]: ReturnType<F> } = { [key in K]: ReturnType<F> },
>(target: T, key: K, fn: F) {
  const enhanced = target as T & O;
  enhanced[key] = enhanced[key] ?? fn(target);
  return enhanced;
}
