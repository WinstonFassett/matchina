import { EffectFunc } from "./function-types";

const EmptyTransform = <E>(event: E) => event;
const EmptyEffect = <E>(_event: E) => {};
const EmptyGuard = <E>(_event: E) => true;

/**
 * Lifecycle interface defines the methods for managing state transitions and effects.
 * Implemented by {@link StateMachine} and {@link StoreMachine} to handle state changes.
 * It provides a structured way to handle state changes, including guards, effects, and notifications.
 *
 * Lifecycle steps:
 * 1. `transition(ev)` - Triggers the transition lifecycle, handling all steps for processing a change event.
 * 2. `guard(ev)` - Checks if the transition is allowed.
 * 3. `handle(ev)` - Processes the event, may abort if returns undefined.
 * 4. `before(ev)` - Prepares for state change, may abort if returns undefined.
 * 5. `update(ev)` - Applies the state update.
 * 6. `effect(ev)` - Runs side effects, calls leave/enter hooks.
 * 7. `leave(ev)` - Called when leaving the previous state.
 * 8. `enter(ev)` - Called when entering the new state.
 * 9. `notify(ev)` - Notifies subscribers of the change.
 * 10. `after(ev)` - Final hook after transition completes.
 */
export interface EventLifecycle<E> {
  /**
   * Triggers the transition lifecycle, handling all steps for processing a change event.
   */
  transition(change: E): void;
  /**
   * Checks if a transition event is allowed to proceed. Returns true to continue, false to abort.
   */
  guard(ev: E): boolean;
  /**
   * Processes the event. May abort the transition if returns undefined.
   */
  handle(ev: E): E | undefined;
  /**
   * Called before the transition is applied. May abort if returns undefined.
   * (Represents a beforeTransition hook, not state entry/exit.)
   */
  before(ev: E): E | undefined;
  /**
   * Applies the state update.
   */
  update(ev: E): void;
  /**
   * Runs side effects for the transition. By default, calls `leave` and `enter` hooks.
   */
  effect(ev: E): void;
  /**
   * Called when leaving the previous state.
   */
  leave(ev: E): void;
  /**
   * Called when entering the new state.
   */
  enter(ev: E): void;
  /**
   * Notifies subscribers of the change.
   */
  notify(ev: E): void;
  /**
   * Final hook after transition completes. (Represents afterTransition, not state entry/exit.)
   */
  after(ev: E): void;
}

export function withLifecycle<T extends object = any, E = any>(
  target: T,
  update: EffectFunc<E>
): EventLifecycle<E> & T {
  return createUpdateLifecycle(update, target);
}

function createUpdateLifecycle<E, T extends object = any>(
  update: EffectFunc<E>,
  target: T = {} as any
): EventLifecycle<E> & T {
  const lifecycle: EventLifecycle<E> & T = Object.assign(target, {
    guard: EmptyGuard,
    handle: EmptyTransform,
    before: EmptyTransform,
    update: (ev: E) => update(ev),
    effect(ev: E) {
      lifecycle.leave(ev); // left previous
      lifecycle.enter(ev); // entered next
    },
    leave: EmptyEffect,
    enter: EmptyEffect,
    notify: EmptyEffect,
    after: EmptyEffect,
    transition(ev: E) {
      if (!lifecycle.guard(ev)) {
        return;
      }
      let output = lifecycle.handle(ev);
      if (!output) {
        console.log("Transition aborted by handle", ev);
        return;
      }
      output = lifecycle.before(output);
      if (!output) {
        return;
      }
      lifecycle.update(output);
      lifecycle.effect(output);
      lifecycle.notify(output);
      lifecycle.after(output);
      return output;
    },
  });
  return lifecycle;
}
