import { matchboxFactory } from "./matchbox-factory";
import { TaggedTypes } from "./matchbox-factory-types";
import { StateMatchboxFactory } from "./state-types";

/**
 * `defineStates` creates a type-safe state factory for your state machine.
 * Each key in the config becomes a state constructor, inferring parameters and data shape.
 *
 * Usage:
 * ```ts
 * const states = defineStates({
 *   SomeEmptyState: undefined, // No parameters
 *   SomeValueState: "any value here" || 42, // Any value as data
 *   SomeStateWithCreate: (...anyParameters) => ({ ...anyPayload }),
 * });
 * // Usage
 * states.SomeEmptyState().key; // "SomeEmptyState"
 * states.SomeValueState().data; // "any value here" || 42
 * states.SomeStateWithCreate("param1", "param2").data; // { ...anyPayload }
 * ```
 *
 * Type benefits:
 *   - State keys and data are fully inferred
 *   - Pattern matching and type guards are available
 *   - Exhaustive match on state keys
 * @example
 * ```typescript
 *   const states = defineStates({
 *     Idle: undefined,
 *     Loading: (query: string) => ({ query }),
 *     Success: (query: string, results: string[]) => ({ query, results }),
 *     Error: (query: string, message: string) => ({ query, message }),
 *   });
 *
 *   // Usage:
 *   states.Idle().key // "Idle"
 *   states.Loading("search").data // { query: "search" }
 *   states.Success("search", ["a", "b"]).data // { query, results }
 * ```
 */
export function defineStates<Config extends TaggedTypes>(config: Config) {
  return matchboxFactory(config, "key") as StateMatchboxFactory<Config>;
}

export type { StateMatchbox, StateMatchboxFactory } from "./state-types";
