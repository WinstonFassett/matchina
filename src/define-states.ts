import { matchboxFactory } from "./matchbox-factory";
import { TaggedTypes } from "./matchbox-factory-types";
import { States } from "./state-types";

/**
 * `defineStates` creates a type-safe state factory for your state machine.
 * Each key in the config becomes a state constructor, inferring parameters and data shape.
 *
 * Example:
 * ```typescript
 *   const states = defineStates({
 *     Idle: undefined,
 *     Loading: (query: string) => ({ query }),
 *     Success: (query: string, results: string[]) => ({ query, results }),
 *     Error: (query: string, message: string) => ({ query, message }),
 *   });
 * ```
 *
 * Usage:
 * ```typescript
 *   states.Idle().key // "Idle"
 *   states.Loading("search").data // { query: "search" }
 *   states.Success("search", ["a", "b"]).data // { query, results }
 * ```
 *
 * Type benefits:
 *   - State keys and data are fully inferred
 *   - Pattern matching and type guards are available
 *   - Exhaustive match on state keys
 */
export function defineStates<Config extends TaggedTypes>(config: Config) {
  return matchboxFactory(config, "key") as States<Config>;
}

export { StateMatchbox, States } from "./state-types";
