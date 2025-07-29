import { MatchCases } from "./match-case-types";

/**
 * Pattern-matching utility for handling cases by key.
 * Invokes the handler for the given key, or the fallback '_' handler if present.
 * Throws an error if no handler is found and exhaustive is true.
 *
 * @template C - Cases object type
 * @template A - Return type of handlers
 * @template Exhaustive - Whether to throw if no handler matches (default: true)
 * @param exhaustive - If true, throws when no handler matches and no fallback is present.
 * @param casesObj - Object mapping keys to handler functions.
 * @param key - Key to match and dispatch to the corresponding handler.
 * @param params - Parameters to pass to the handler function.
 * @returns The result of the matched handler, or undefined if not exhaustive and no match.
 *
 * Usage:
 * ```ts
 * match(true, { foo: fn, bar: fn, _: fallback }, "foo", ...params);
 * ```
 */
export function match<
  C extends MatchCases<any, A, Exhaustive>,
  A,
  Exhaustive extends boolean = true,
>(exhaustive = true, casesObj: C, key: string, ...params: any[]): A {
  const handler = (casesObj as any)[key];
  if (handler) {
    return handler(...params) as A;
  } else if (casesObj._) {
    return (casesObj._ as any)(...params) as A;
  } else if (exhaustive) {
    throw new Error(`Match did not handle key: '${key}'`);
  } else {
    return undefined as any;
  }
}
