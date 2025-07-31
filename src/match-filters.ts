
/**
 * Checks if a value matches a filter key or array of keys.
 * Returns true if the value is included in the array or equals the key.
 *
 * @param keyOrKeys - A single key, array of keys, or undefined.
 * @param value - The value to test.
 * @returns True if the value matches the key(s) or if keyOrKeys is undefined.
 * @source This function is useful for matching values against filter keys or arrays,
 * supporting flexible filter logic for data, events, or state transitions.
 *
 * @example
 * ```ts
 * matchKey(["a", "b"], "a"); // true
 * matchKey("b", "a"); // false
 * matchKey(undefined, "a"); // true
 * ```
 */
export function matchKey<T>(keyOrKeys: T | T[] | undefined, value: T) {
  if (keyOrKeys === undefined) {
    return true;
  }
  return Array.isArray(keyOrKeys)
    ? (keyOrKeys.includes(value) || keyOrKeys.length === 0)
    : keyOrKeys === value
}

/**
 * Normalizes filter input to a tuple of [type, from, to].
 * Accepts either a tuple or an object with type, from, and to properties.
 *
 * @param parts - Tuple or object describing the filter.
 * @returns A tuple [type, from, to].
 * @source This function is useful for normalizing filter input for event or state transitions,
 * making it easier to handle flexible filter formats in APIs and internal logic.
 *
 * @example
 * ```ts
 * getFilter(["type", "from", "to"]); // ["type", "from", "to"]
 * getFilter([{ type: "t", from: "f", to: "t" }]); // ["t", "f", "t"]
 * ```
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
