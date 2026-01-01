import { FactoryMachineEventImpl } from "./factory-machine-event";
import {
  FactoryMachine,
  FactoryMachineContext,
  FactoryMachineEvent,
  FactoryMachineTransition,
  FactoryMachineTransitions,
} from "./factory-machine-types";
import { withLifecycle } from "./event-lifecycle";
import { FactoryKeyedState, KeyedStateFactory } from "./state-keyed";
import { ResolveEvent } from "./state-machine-types";
import { KeysWithZeroRequiredArgs } from "./utility-types";
import { brandFactoryMachine } from "./machine-brand";
import { createStaticShapeStore } from "./hsm/shape-store";

/**
 * Creates a type-safe state machine from a state factory and transitions.
 * Usage:
 * ```ts
 * // Define states and create a machine
 * const states = defineStates({...})
 * const machine = createMachine(states, transition, initialState)
 * // Setup machine with effects, guards, etc.
 * setup(machine)(effect(...), guard(...))
 * // Use the machine
 * machine.send("eventName", ...params)
 * machine.getState().match({
 *   StateKey: (data) => { ... },
 *   AnotherStateKey: (data) => { ... },
 *   // ...
 * })
 * ```
 * Type benefits:
 *   - Transition types and event parameters are inferred from state factory
 *   - State and event keys are autocompleted
 *   - Pattern matching and type guards for states and events
 *   - Exhaustive match on state and event keys
 *   - API for sending events, inspecting state, and matching on state
 * @example
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
 *   machine.send("search", "query")
 *   machine.getState().key // "Loading"
 *   machine.getState().match({
 *     Idle: () => ..., Loading: ({ query }) => ..., Success: ({ results }) => ..., Error: ({ message }) => ...
 *   })
 * ```
 */
export function createMachine<
  SF extends KeyedStateFactory,
  TC extends FactoryMachineTransitions<SF>,
  FC extends FactoryMachineContext<SF> = { states: SF; transitions: TC },
  E extends FactoryMachineEvent<FC> = FactoryMachineEvent<FC>,
>(
  states: SF,
  transitions: TC,
  init: KeysWithZeroRequiredArgs<FC["states"]> | FactoryKeyedState<FC["states"]>
): FactoryMachine<FC> {
  const initialState = typeof init === "string" ? states[init]() : init;

  let lastChange: E = new FactoryMachineEventImpl<E>(
    "__initialize" as E["type"],
    initialState as E["from"],
    initialState as E["to"],
    []
  ) as E;

  // Determine the initial key - either from the init parameter or from the initial state
  const initialKey = typeof init === "string" ? init : init.key;

  const machine = withLifecycle(
    {
      states,
      transitions,
      initialKey, // Store for shape building and introspection
      getChange: () => lastChange,
      getState: () => lastChange.to,
      send(type: E["type"], ...params: any[]) {
        const resolved = machine.resolveExit({
          type,
          params,
          from: lastChange.to,
        } as ResolveEvent<E>);
        if (resolved) {
          machine.transition(resolved);
        }
      },
      resolveExit: (ev: ResolveEvent<E>) => {
        const to = resolveNextState<FC>(transitions, states, ev);
        return to
          ? new FactoryMachineEventImpl(ev.type, ev.from, to, ev.params) as E
          : undefined;
      },
    } as unknown as Partial<FactoryMachine<FC>>,
    (ev: E) => {
      lastChange = ev;
    }
  ) as FactoryMachine<FC>;

  brandFactoryMachine(machine);

  // Attach shape for visualization (works for both flat and hierarchical machines)
  // This enables visualization for all machines created with createMachine()
  try {
    const shapeStore = createStaticShapeStore(machine);
    Object.defineProperty(machine, 'shape', {
      value: shapeStore,
      enumerable: false,
      configurable: true,
      writable: true,
    });
  } catch (e) {
    console.error('[createMachine] Failed to attach shape:', e);
  }

  return machine;
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
