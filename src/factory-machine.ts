import { FactoryMachineEventImpl } from "./factory-machine-event";
import {
  FactoryMachine,
  FactoryMachineContext,
  FactoryMachineEvent,
  FactoryMachineTransition,
  FactoryMachineTransitions,
} from "./factory-machine-types";
import { FactoryState } from "./factory-state";
import { StateFactory } from "./factory-state";
import { ResolveEvent } from "./state-machine-types";
import { createTransitionMachine } from "./transition-machine";
import { KeysWithZeroRequiredArgs } from "./utility-types";

/**
 * defineStates creates a type-safe state factory for your state machine.
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
 *
 * @source This function is useful for creating a type-safe state factory for state machines,
 * enabling pattern matching, type guards, and exhaustive handling of state keys. It simplifies
 * state construction and improves type inference for state-driven logic.
 */

/**
 * Creates a type-safe state machine from a state factory and transitions.
 *
 * Example:
 * ```typescript
 *   const machine = createMachine(
 *     states,
 *     {
 *       Idle: { search: "Loading" },
 *       Loading: {
 *         success: (results: string[]) => (ev) => states.Success(ev.from.data.query, results),
 *         error: (message: string) => (ev) => states.Error(ev.from.data.query, message),
 *       },
 *       Success: {},
 *       Error: {},
 *     },
 *     "Idle"
 *   );
 * ```
 *
 * Usage:
 * ```typescript
 *   machine.send("search", "query")
 *   machine.getState().key // "Loading"
 *   machine.getState().match({
 *     Idle: () => ..., Loading: ({ query }) => ..., Success: ({ results }) => ..., Error: ({ message }) => ...
 *   })
 * ```
 *
 * Type benefits:
 *   - Transition types and event parameters are inferred from state factory
 *   - State and event keys are autocompleted
 *   - Pattern matching and type guards for states and events
 *   - Exhaustive match on state and event keys
 *   - API for sending events, inspecting state, and matching on state
 *
 * @source This function is useful for creating type-safe state machines with inferred transitions,
 * state and event keys, and pattern matching. It enables robust state-driven logic and exhaustive
 * handling of state and event transitions.
 */

/**
 * Resolves the next state for a given event using the provided transitions and states.
 * @param transitions - Transition handlers for each state
 * @param states - State factory functions
 * @param ev - The event to resolve
 * @returns The next state instance or undefined if no transition exists
 * @source This function is useful for determining the next state in a state machine based on
 * the current state, event, and transition handlers. It enables dynamic state resolution and
 * transition logic.
 */

/**
 * Resolves the exit state for a given transition and event.
 * @param transition - Transition handler or state key
 * @param ev - The event to resolve
 * @param states - State factory functions
 * @returns The resolved state instance or undefined
 * @source This function is useful for executing transition logic and resolving the resulting state
 * in a state machine. It supports both direct state transitions and transition handlers for flexible
 * state management.
 */
export function createMachine<
  SF extends StateFactory,
  TC extends FactoryMachineTransitions<SF>,
  FC extends FactoryMachineContext<SF> = { states: SF; transitions: TC },
  E extends FactoryMachineEvent<FC> = FactoryMachineEvent<FC>,
>(
  states: SF,
  transitions: TC,
  init: KeysWithZeroRequiredArgs<FC["states"]> | FactoryState<FC["states"]>
): FactoryMachine<FC> {
  
  const initialState =
    typeof init === "string"
      ? states[init]({})
      : (init as ReturnType<SF[keyof SF]>);

  return Object.assign(
    createTransitionMachine<E>(
      transitions as any,
      initialState as E["from"]
    ),
    {
      states,
      resolveExit: (ev: ResolveEvent<E>): E | undefined => {
        const to = resolveNextState<FC>(transitions, states, ev);
        return to
          ? (new FactoryMachineEventImpl<E>(
              ev.type,
              ev.from,
              to,
              ev.params
            ) as E)
          : undefined;
      },
    }
  ) as any;
}

/**
 * Resolves the next state for a given event using the provided transitions and states.
 * @param transitions - Transition handlers for each state
 * @param states - State factory functions
 * @param ev - The event to resolve
 * @returns The next state instance or undefined if no transition exists
 * @source This function is useful for determining the next state in a state machine based on
 * the current state, event, and transition handlers. It enables dynamic state resolution and
 * transition logic.
 */
export function resolveNextState<FC extends FactoryMachineContext<any>>(
  transitions: FC["transitions"],
  states: FC["states"],
  ev: ResolveEvent<FactoryMachineEvent<FC>>
) {
  const transition = transitions[ev.from.key]?.[ev.type];
  return resolveExitState(transition, ev, states);
}

/**
 * Resolves the exit state for a given transition and event.
 * @param transition - Transition handler or state key
 * @param ev - The event to resolve
 * @param states - State factory functions
 * @returns The resolved state instance or undefined
 * @source This function is useful for executing transition logic and resolving the resulting state
 * in a state machine. It supports both direct state transitions and transition handlers for flexible
 * state management.
 */
export function resolveExitState<FC extends FactoryMachineContext<any>>(
  transition: FactoryMachineTransition<FC["states"]> | undefined,
  ev: ResolveEvent<FactoryMachineEvent<FC>>,
  states: FC["states"]
) {
  if (!transition) {
    return undefined;
  }
  if (typeof transition === "function") {
    const stateOrFn = transition(...ev.params);
    return typeof stateOrFn === "function" ? (stateOrFn as any)(ev) : stateOrFn;
  }
  return states[transition as keyof typeof states](...ev.params) as any;
}

export {
  type FactoryMachine,
  type FactoryMachineTransitions,
} from "./factory-machine-types";
