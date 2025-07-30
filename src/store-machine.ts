import { Lifecycle, withLifecycle } from "./lifecycle";
import { storeApi, addStoreApi, ExtractStoreParams, CurriedTransition, DirectTransition } from "./store-machine-api";

export { storeApi , addStoreApi };

export interface StoreMachine<
  T,
  TR extends StoreTransitionRecord<T> = StoreTransitionRecord<T>,
> extends Lifecycle<StoreMachine<T, TR>> {
  getState(): T;
  getChange(): StoreChange<T>;
  dispatch<E extends keyof TR & string>(
    type: E,
    ...params: ExtractStoreParams<TR, E>
  ): void;
  actions: TR;
  resolveExit(ev: StoreChange<T>): StoreChange<T> | undefined;
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
export type StoreTransitionRecord<
  T,
> = {
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
export function createStoreMachine<
  T,
  TR extends StoreTransitionRecord<T> = StoreTransitionRecord<T>,
>(initialValue: T, transitions: TR): StoreMachine<T, TR> {
  let lastChange: StoreChange<T> = {
    type: "__initialize",
    params: [],
    from: initialValue,
    to: initialValue,
  };
  const machine = withLifecycle<StoreMachine<T, TR>>(
    {
      actions: transitions,
      getState: () => lastChange.to,
      getChange: () => lastChange,
      dispatch(type, ...params) {
        const handler = machine.actions[type];
        if (!handler) return;
        const valueOrFn = handler(...params);
        const from = machine.getState();        
        const change: StoreChange<T> = { type, params, from, to: from };
        const to = resolveTransitionResult(valueOrFn, change);
        change.to ??= to as T;
        if (change.to === undefined) return;
        machine.transition(change);
      },      
    } as StoreMachine<T, TR>,
    (change) => {
      lastChange = change;
    }
  );
  return machine;
}

function resolveTransitionResult<T>(result: any, change: StoreChange<T>): T | undefined {
  let to: T | undefined;
  if (typeof result === "function") {
    to = (result as (change: StoreChange<T>) => T)(change);
  } else {
    to = result as T;
  }
  return to;  
}
