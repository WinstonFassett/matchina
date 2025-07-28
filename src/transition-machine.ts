import { StateMachine, TransitionEvent } from "./state-machine";
import { ResolveEvent } from "./state-machine-types";

const EmptyTransform = <E>(event: E) => event;
const EmptyEffect = <E>(_event: E) => {};

export type TransitionRecord = {
  [from: string]: {
    [type: string]: string | object;
  };
};
interface TransitionContext {
  transitions: TransitionRecord;
}

/**
 * TransitionMachine is the low-level, kernel-like implementation of a state machine in Matchina.
 * It provides a minimal, flexible API for managing state transitions and lifecycle hooks.
 *
 * Most users should prefer FactoryMachine, which wraps TransitionMachine and adds powerful TypeScript inference,
 * ergonomic APIs, and matchbox-based state factories. Use TransitionMachine only if you need to work with primitive
 * state values or require maximum flexibility (e.g., your state is not a tagged union).
 *
 * Usage:
 *   const machine = createTransitionMachine(transitions, initialState);
 *   machine.send('eventType', ...params);
 *   const state = machine.getState();
 *
 * Type benefits:
 *   - Transition types and state keys are inferred from the event type
 *   - Lifecycle hooks (handle, before, effect, notify, after, enter, leave) are customizable
 *   - getChange() returns the last transition event
 *   - getState() returns the current state
 *
 * See also: FactoryMachine (see createMachine) for a more type-safe, ergonomic API.
 */
export type TransitionMachine<E extends TransitionEvent> = StateMachine<E> & TransitionContext;

/**
 * Creates a generic transition-based state machine.
 *
 * @param transitions - TransitionRecord mapping state keys and event types to next state
 * @param initialState - Initial state instance
 * @returns A TransitionMachine instance with transition logic and lifecycle hooks
 *
 * Example:
 *   const transitions = {
 *     Idle: { start: 'Running' },
 *     Running: { stop: 'Idle' },
 *   };
 *   const machine = createTransitionMachine(transitions, states.Idle());
 *   machine.send('start');
 *   machine.getState().key; // 'Running'
 *
 * For advanced type safety and ergonomic API, see FactoryMachine and createMachine.
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
