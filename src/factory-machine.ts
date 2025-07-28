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
 * @template SF StateFactory type defining available states
 * @template TC Transitions type mapping state transitions
 * @template FC Context type containing states and transitions
 * @template E Event type for machine events
 * @param states - Object containing state factory functions
 * @param transitions - Object mapping state keys to transition handlers
 * @param init - Initial state key or state instance
 * @returns A FactoryMachine instance with transition logic and state definitions
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
  // Fix type for initialState to match createTransitionMachine's expectation
  const initialState =
    typeof init === "string"
      ? states[init]({})
      : (init as ReturnType<SF[keyof SF]>);

  return Object.assign(
    createTransitionMachine<E>(
      transitions as any,
      // Explicit cast to E['from'] to satisfy createTransitionMachine's type
      initialState as E["from"]
    ),
    {
      states,
      /**
       * Resolves the next event for a given exit event, returning a new event if a transition exists.
       * @param ev - The event to resolve
       * @returns A new FactoryMachineEvent if a transition is found, otherwise undefined
       */
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
