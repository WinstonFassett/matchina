import { Effect } from "./function-types";

const EmptyTransform = <E>(event: E) => event;
const EmptyEffect = <E>(_event: E) => {};
const EmptyGuard = <E>(_event: E) => true;

export interface Lifecycle<E> {
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


export type Lifecycle1<E> = {
  transition: (ev: E) => void;
  before: (ev: E) => E | undefined;
  handle: (ev: E) => E | undefined;
  update: Effect<E>;
  effect: Effect<E>;
  notify: Effect<E>;
  after: Effect<E>;
};

export function withLifecycle<T extends object = {}, E = any>(
  target: T,
  update: Effect<E>,
): Lifecycle<E> & T {
  return createUpdateLifecycle(update, target);
}
  

export function createUpdateLifecycle<E, T extends object = {}>(
  update: Effect<E>,
  target: T = {} as any
): Lifecycle<E> & T {
  const lifecycle: Lifecycle<E> & T = Object.assign(
    target,
    {
      guard: EmptyGuard,
      handle: EmptyTransform,
      before: EmptyTransform,
      update,
      effect(ev: E) {
        lifecycle.leave(ev); // left previous
        lifecycle.enter(ev); // entered next
      },
      leave: EmptyEffect,
      enter: EmptyEffect,
      notify: EmptyEffect,
      after: EmptyEffect,  
      transition(ev: E) {
        let output = lifecycle.handle(ev);
        if (!output) return;
        output = lifecycle.before(output);
        if (!output) return;
        lifecycle.update(output);
        lifecycle.effect(output);
        lifecycle.notify(output);
        lifecycle.after(output);
        return output;
      },
    }
  ) ;
  return lifecycle;
}
