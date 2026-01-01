/**
 * Utilities for working with flattened state keys
 */

/**
 * Parse a flattened state key into parent and child components
 * 
 * @param key - Flattened state key (e.g., "Payment.MethodEntry")
 * @returns Object with parent, child, parts, and full properties
 */
export function parseFlatStateKey(key: string) {
  const parts = key.split(".");
  return {
    parent: parts[0],
    child: parts[1] || null,
    parts,
    full: key
  };
}
