import { StateMachine, TransitionEvent } from "./state-machine";
import { ResolveEvent } from "./state-machine-types";
import { createStoreMachine, StoreTransitionRecord, StoreChange, StoreMachine } from "./store-machine";

const EmptyTransform = <E>(event: E) => event;
const EmptyEffect = <E>(_event: E) => {};

/**
 * TransitionRecord defines the structure of state transitions in a {@link TransitionMachine}.
 * It maps state keys to event types and their corresponding next states.
 *
 * Example:
 * ```ts
 * const transitions: TransitionRecord = {
 *   Idle: { start: 'Running' },
 *   Running: { stop: 'Idle' },
 * };
 * ```
 *
 * This structure allows the TransitionMachine to resolve state changes based on events.
 * @source
 * This type is for primitive, weakly-typed state machines where states are not tagged unions.
 * It provides a flexible way to define transitions without strict type constraints.
 * It is used in the TransitionMachine implementation to manage state transitions based on event types.
 * It is a core part of the Matchina API, enabling developers to define and manage state
 * transitions in a flexible manner.
 */
export interface TransitionRecord {
  [from: string]: {
    [type: string]: string | object;
  };
}
interface TransitionContext {
  transitions: TransitionRecord;
}

/**
 * TransitionMachine is the low-level, kernel-like state machine type in Matchina.
 * Provides minimal, flexible APIs for managing state transitions and lifecycle hooks.
 *
 * Prefer {@link FactoryMachine} and {@link createMachine} for ergonomic, type-safe usage.
 * Use TransitionMachine only for primitive state values or maximum flexibility.
 *
 * Type benefits:
 *   - Transition types and state keys are inferred from the event type
 *   - Lifecycle hooks are customizable:
 *     - {@link TransitionMachine.handle | handle}
 *     - {@link TransitionMachine.before | before}
 *     - {@link TransitionMachine.effect | effect}
 *     - {@link TransitionMachine.notify | notify}
 *     - {@link TransitionMachine.after | after}
 *     - {@link TransitionMachine.enter | enter}
 *     - {@link TransitionMachine.leave | leave}
 *   - {@link TransitionMachine.getChange | getChange} returns the last transition event
 *   - {@link TransitionMachine.getState | getState} returns the current state
 *
 * @see FactoryMachine
 * @see createMachine
 */
export interface TransitionMachine<E extends TransitionEvent> extends StateMachine<E>, TransitionContext {}

/**
 * Creates a generic transition-based state machine.
 *
 * @param transitions - TransitionRecord mapping state keys and event types to next state
 * @param initialState - Initial state instance
 * @returns A TransitionMachine instance with transition logic and lifecycle hooks
 *
 * @example
 * ```ts
 * import { createTransitionMachine } from "./transition-machine";
 *
 * const transitions: TransitionRecord = {
 *   Idle: { start: "Running" },
 *   Running: { stop: "Idle" },
 * };
 *
 * const initialState = { key: "Idle" };
 * const machine = createTransitionMachine(transitions, initialState);
 *
 * machine.send("start");
 * const state = machine.getState();
 * // state.key === "Running"
 * ```
 *
 * @see FactoryMachine
 * @see createMachine
 */
export function createTransitionMachine<E extends TransitionEvent>(
  transitions: TransitionRecord,
  initialState: E["from"]
): TransitionMachine<E> {
  // Directly pass transitions as StoreTransitionRecord if compatible
  const storeMachine = createStoreMachine<E["from"]>(initialState, transitions as unknown as StoreTransitionRecord<E["from"]>);
  // Cast to TransitionMachine<E>
  return storeMachine as unknown as TransitionMachine<E>;
}
