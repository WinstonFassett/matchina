import {
  StoreMachine,
  StoreTransitionRecord,
  StoreChange,
} from "./store-machine";

/**
 * StoreMachineApi provides a convenient API for sending events to a store machine.
 * It maps transition keys to sender functions that take the appropriate parameters.
 */
export type StoreMachineApi<
  T,
  TR extends StoreTransitionRecord<T> = StoreTransitionRecord<T>,
> = {
  [K in keyof TR]: (...args: ExtractStoreParams<TR, K>) => void;
};

/**
 * addEventApi adds an 'api' property to a StoreMachine, providing convenient event sender functions.
 */
export type addEventApi<M extends StoreMachine<any, any>> = M & {
  api: StoreMachineApi<ReturnType<M["getState"]>, M["transitions"]>;
};

/**
 * Creates an API object for a StoreMachine instance, providing event sender functions for each transition.
 *
 * @template T - Type of store state
 * @template TR - Type of store transitions
 * @param {StoreMachine<T, TR>} machine - The store machine instance to generate the API for
 * @returns {StoreMachineApi<T, TR>} An object mapping transition keys to sender functions
 *
 * @example
 * ```ts
 * const todoApi = eventApi(todoStore);
 * todoApi.addTodo("New task");
 * todoApi.toggleTodo("123");
 * ```
 */
export function storeApi<
  T,
  TR extends StoreTransitionRecord<T> = StoreTransitionRecord<T>,
>(machine: StoreMachine<T, TR>): StoreMachineApi<T, TR> {
  const api = {} as StoreMachineApi<T, TR>;

  for (const transitionKey in machine.transitions) {
    const key = transitionKey as keyof TR & string;
    api[key] = (...params: ExtractStoreParams<TR, typeof key>) => {
      return machine.dispatch(key, ...params);
    };
  }

  return api;
}

/**
 * Enhances a StoreMachine instance with an API property containing event sender functions.
 *
 * @template T - Type of store state
 * @template TR - Type of store transitions
 * @param {StoreMachine<T, TR>} machine - The store machine instance to enhance
 * @returns {addEventApi<StoreMachine<T, TR>>} The enhanced machine with an api property
 *
 * @example
 * ```ts
 * const enhancedTodoStore = addEventApi(todoStore);
 * enhancedTodoStore.api.addTodo("New task");
 * ```
 */
export function addStoreApi<
  T,
  TR extends StoreTransitionRecord<T> = StoreTransitionRecord<T>,
>(machine: StoreMachine<T, TR>): addEventApi<StoreMachine<T, TR>> {
  const enhanced = machine as addEventApi<StoreMachine<T, TR>>;
  if (enhanced.api) {
    return enhanced;
  }

  return Object.assign(machine, {
    api: storeApi(machine),
  }) as addEventApi<StoreMachine<T, TR>>;
}
/**
 * Extract parameter types from a store transition handler
 */

export type ExtractStoreParams<
  TR extends Record<string, DirectTransition<any> | CurriedTransition<any>>,
  E extends keyof TR,
> = Parameters<TR[E]>;

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

export type CurriedTransition<T> = (
  ...args: any[]
) => (change: StoreChange<T>) => T;
