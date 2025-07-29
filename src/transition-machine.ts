import { StateMachine, TransitionEvent } from "./state-machine";
import { ResolveEvent } from "./state-machine-types";

const EmptyTransform = <E>(event: E) => event;
const EmptyEffect = <E>(_event: E) => {};

/**
 * TransitionRecord defines the structure of state transitions in a TransitionMachine.
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
  let lastChange = {
    type: "__initialize",
    to: initialState,
  } as E;
  const machine: TransitionMachine<E> = {
    transitions,
    getChange: () => lastChange,
    getState: () => lastChange.to,
    send(type, ...params) {
      const lastChange = machine.getChange();
      const resolved = machine.resolveExit({
        type,
        params,
        from: lastChange.to,
      } as ResolveEvent<E>);
      if (resolved) {
        machine.transition(resolved);
      }
    },
    resolveExit(ev) {
      const to = machine.transitions[ev.from as any][ev.type];
      if (to) {
        return { ...ev, to } as E; // TODO: use Object.assign
      }
    },
    guard: (ev: E) => !!ev,
    transition(change: E) {
      if (!machine.guard(change)) return;      
      let update = machine.handle(change); // process change
      if (!update) return;      
      update = machine.before(update); // prepare update
      if (!update) return;      
      machine.update(update); // apply update
      machine.effect(update); // trigger effects
      machine.notify(update); // notify consumers
      machine.after(update); // cleanup
    },
    handle: EmptyTransform<E>,
    before: EmptyTransform<E>,
    update: (update: E) => { lastChange = update },
    effect(ev: E) {
      machine.leave(ev); // left previous
      machine.enter(ev); // entered next
    },
    leave: EmptyEffect<E>,
    enter: EmptyEffect<E>,
    notify: EmptyEffect<E>,
    after: EmptyEffect<E>,
  };
  return machine;
}
