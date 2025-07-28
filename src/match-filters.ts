import { NestableFilters, HasFilterValues } from "./match-filter-types";

/**
 * Checks if an item matches all conditions in a filter object.
 * Returns true if every key in the condition matches the corresponding item value.
 *
 * @param item - The object to test.
 * @param condition - The filter conditions to match.
 * @returns True if the item matches all filter conditions.
 */
export function matchFilters<
  T extends Record<string, any>,
  C extends NestableFilters<T>,
>(item: T, condition: C): item is T & HasFilterValues<T, C> {
  return Object.keys(condition).every((key) =>
    matchKey(condition[key as keyof C], item[key])
  );
}

/**
 * Asserts that an item matches the filter conditions, returning the item if so.
 * Throws an error if the item does not match.
 *
 * @param item - The object to test.
 * @param condition - The filter conditions to match.
 * @returns The item, typed as matching the filter values.
 * @throws Error if the item does not match the filter.
 */
export function asFilterMatch<
  T extends Record<string, any>,
  C extends NestableFilters<T>,
>(item: T, condition: C): T & HasFilterValues<T, C> {
  if (matchFilters(item, condition)) {
    return item;
  }
  throw new Error("not a match");
}

/**
 * Checks if a value matches a filter key or array of keys.
 * Returns true if the value is included in the array or equals the key.
 *
 * @param keyOrKeys - A single key, array of keys, or undefined.
 * @param value - The value to test.
 * @returns True if the value matches the key(s) or if keyOrKeys is undefined.
 */
export function matchKey<T>(keyOrKeys: T | T[] | undefined, value: T) {
  if (keyOrKeys === undefined) {
    return true;
  }
  return Array.isArray(keyOrKeys)
    ? keyOrKeys.includes(value)
    : keyOrKeys === value;
}

/**
 * Normalizes filter input to a tuple of [type, from, to].
 * Accepts either a tuple or an object with type, from, and to properties.
 *
 * @param parts - Tuple or object describing the filter.
 * @returns A tuple [type, from, to].
 */
type ChangeFilterTuple = [type?: string, from?: string, to?: string];
export function getFilter(
  parts:
    | ChangeFilterTuple
    | [filter: { type?: string; from?: string; to?: string }]
): [type?: string, from?: string, to?: string] {
  if (parts.length === 1 && typeof parts[0] === "object") {
    const filter = parts[0];
    return [filter.type, filter.from, filter.to];
  }
  return parts as any;
}
