import { createApi } from "./factory-machine-event-api";

/**
 * StoreMachine is a minimal, event-driven state container for a single value.
 * It supports lifecycle hooks and event-based updates, similar to an atom or primitive store.
 *
 * Use {@link createStoreMachine} to create a store machine instance.
 *
 * Type benefits:
 *   - Value type is fully inferred
 *   - Event types and parameters are flexible
 *   - Lifecycle hooks for custom logic
 *   - API for sending events and inspecting state
 *
 * @see createStoreMachine
 * @see TransitionMachine
 * @see FactoryMachine
 *
 * Example usage:
 * ```ts
 * import { createStoreMachine } from "./store-machine";
 *
 * // Counter store
 * const counter = createStoreMachine<number>({
 *   increment: (value, amount = 1) => value + amount,
 *   decrement: (value, amount = 1) => value - amount,
 *   set: (value, next) => next,
 *   reset: 0,
 * }, 0);
 *
 * counter.send("increment");
 * counter.send("increment", 5);
 * counter.send("decrement", 2);
 * counter.send("set", 42);
 * counter.send("reset");
 *
 * console.log(counter.getState()); // 0
 * console.log(counter.getChange()); // { type: "reset", params: [], from: 42, to: 0 }
 * ```
 */
/**
 * Helper type for transition handlers that return a direct value
 */
export type DirectTransition<T> = (...args: any[]) => T;

/**
 * Helper type for transition handlers that return a function
 */
export type CurriedTransition<T> = (...args: any[]) => ((change: StoreChange<T>) => T);

/**
 * Extract parameter types from a store transition handler
 */
export type ExtractStoreParams<
  TR extends Record<string, DirectTransition<any> | CurriedTransition<any>>,
  E extends keyof TR
> = Parameters<TR[E]>;

export interface StoreMachine<T, TR extends StoreTransitionRecord<T> = StoreTransitionRecord<T>> {
  getState(): T;
  getChange(): StoreChange<T>;
  send<E extends keyof TR & string>(type: E, ...params: ExtractStoreParams<TR, E>): void;
  transitions: TR;
  resolveExit(ev: StoreChange<T>): StoreChange<T> | undefined;
  // Lifecycle hooks
  handle(change: StoreChange<T>): StoreChange<T>;
  before(change: StoreChange<T>): StoreChange<T>;
  update(change: StoreChange<T>): void;
  effect(change: StoreChange<T>): void;
  notify(change: StoreChange<T>): void;
  after(change: StoreChange<T>): void;
  transition(change: StoreChange<T>): void;
}

/**
 * StoreTransitionRecord defines the structure of event-driven updates for StoreMachine.
 * Each event type maps to a function that takes any params and returns either:
 *   - a value of type T
 *   - or a function that takes a StoreChange<T> and returns T
 *
 * Example:
 * ```ts
 * const transitions: StoreTransitionRecord<number> = {
 *   increment: (amount = 1) => (change) => change.from + amount,
 *   set: (next) => next,
 *   custom: () => (change) => change.from * 2,
 * };
 * ```
 */
export type StoreTransitionRecord<T, E extends StoreChange<T> = StoreChange<T>> = {
  [event: string]: DirectTransition<T> | CurriedTransition<T>;
};

/**
 * StoreChange describes a change event in a StoreMachine.
 * Includes the event type, parameters, previous value, and next value.
 *
 * @template T - Value type
 * @property type - The event type string
 * @property params - Parameters passed to the event
 * @property from - Previous value
 * @property to - Next value
 *
 * Example:
 * ```ts
 * { type: "increment", params: [2], from: 1, to: 3 }
 * ```
 */
export interface StoreChange<T> {
  type: string;
  params: any[];
  from: T;
  to: T;
}

const EmptyTransform = <T>(change: StoreChange<T>) => change;
const EmptyEffect = <T>(_change: StoreChange<T>) => {};

/**
 * Creates a minimal, event-driven store machine for a single value.
 *
 * @param transitions - StoreTransitionRecord mapping event types to updater functions or values
 * @param initialValue - Initial value for the store
 * @returns A StoreMachine instance with event-driven update logic and lifecycle hooks
 *
 * @example
 * ```ts
 * import { createStoreMachine } from "./store-machine";
 *
 * const counter = createStoreMachine<number>({
 *   increment: (value, amount = 1) => value + amount,
 *   decrement: (value, amount = 1) => value - amount,
 *   set: (value, next) => next,
 *   reset: 0,
 * }, 0);
 *
 * counter.send("increment");
 * counter.send("increment", 5);
 * counter.send("decrement", 2);
 * counter.send("set", 42);
 * counter.send("reset");
 *
 * console.log(counter.getState()); // 0
 * console.log(counter.getChange()); // { type: "reset", params: [], from: 42, to: 0 }
 * ```
 *
 * @see StoreMachine
 * @see TransitionMachine
 * @see FactoryMachine
 */
export function createStoreMachine<T, TR extends StoreTransitionRecord<T> = StoreTransitionRecord<T>>(
  initialValue: T,
  transitions: TR,
): StoreMachine<T, TR> {
  let lastChange: StoreChange<T> = {
    type: "__initialize",
    params: [],
    from: initialValue,
    to: initialValue,
  };
  const machine: StoreMachine<T, TR> = {
    transitions,
    getState: () => lastChange.to,
    getChange: () => lastChange,
    send(type, ...params) {
      const from = machine.getState();
      const handler = machine.transitions[type];
      if (!handler) return;
      const result = handler(...params);
      let to: T;
      if (typeof result === "function") {
        const change: StoreChange<T> = { type, params, from, to: from };
        to = (result as (change: StoreChange<T>) => T)(change);
      } else {
        to = result as T;
      }
      const change: StoreChange<T> = { type, params, from, to };
      machine.transition(change);
    },
    resolveExit(ev: StoreChange<T>): StoreChange<T> | undefined {
      const handler = machine.transitions[ev.type];
      if (!handler) return undefined;
      const result = handler(...(ev.params || []));
      let to: T;
      if (typeof result === "function") {
        const change: StoreChange<T> = {
          type: ev.type,
          params: ev.params,
          from: ev.from,
          to: ev.from,
        };
        to = (result as (change: StoreChange<T>) => T)(change);
      } else {
        to = result as T;
      }
      return { ...ev, to };
    },
    handle: EmptyTransform,
    before: EmptyTransform,
    update(change) { lastChange = change; },
    effect: EmptyEffect,
    notify: EmptyEffect,
    after: EmptyEffect,
    transition(change: StoreChange<T>) {
      let update = machine.handle(change);
      if (!update) return;
      update = machine.before(update);
      if (!update) return;
      machine.update(update);
      machine.effect(update);
      machine.notify(update);
      machine.after(update);
    },
  };
  return machine;
}


// Example with proper type checking
const store = createStoreMachine(0, {
  increment: (amt: number = 1) => (change) => change.from + amt,
  decrement: (amt: number = 1) => (change) => change.from - amt,
  set: (next: number) => next,
  reset: () => 0,
});

// These calls are now properly type-checked:
store.send("increment"); // Works with default parameter
store.send("increment", 5); // Works with explicit parameter
store.send("decrement"); // Works with default parameter
store.send("set", 42); // Requires a number parameter
store.send("reset"); // No parameters required

// These would cause type errors:
store.send("increment", "not a number"); // Type error: expected number
store.send("set"); // Type error: missing required parameter
store.send("unknown"); // Type error: unknown event type
console.log(store.getState());