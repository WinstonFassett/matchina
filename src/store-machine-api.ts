import { StoreMachine, StoreTransitionRecord, ExtractStoreParams } from "./store-machine";

/**
 * StoreMachineApi provides a convenient API for sending events to a store machine.
 * It maps transition keys to sender functions that take the appropriate parameters.
 */
export type StoreMachineApi<
  T,
  TR extends StoreTransitionRecord<T> = StoreTransitionRecord<T>
> = {
  [K in keyof TR]: (...args: ExtractStoreParams<TR, K>) => void;
};

/**
 * WithApi adds an 'api' property to a StoreMachine, providing convenient event sender functions.
 */
export type WithApi<M extends StoreMachine<any, any>> = M & {
  api: StoreMachineApi<ReturnType<M["getState"]>, M["mutations"]>;
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
 * const todoApi = createApi(todoStore);
 * todoApi.addTodo("New task");
 * todoApi.toggleTodo("123");
 * ```
 */
export function storeApi<
  T,
  TR extends StoreTransitionRecord<T> = StoreTransitionRecord<T>
>(machine: StoreMachine<T, TR>): StoreMachineApi<T, TR> {
  const api = {} as StoreMachineApi<T, TR>;
  
  for (const transitionKey in machine.mutations) {
    const key = transitionKey as keyof TR & string;
    api[key] = ((...params: ExtractStoreParams<TR, typeof key>) => {
      return machine.dispatch(key, ...params);
    });
  }
  
  return api;
}

/**
 * Enhances a StoreMachine instance with an API property containing event sender functions.
 * 
 * @template T - Type of store state
 * @template TR - Type of store transitions
 * @param {StoreMachine<T, TR>} machine - The store machine instance to enhance
 * @returns {WithApi<StoreMachine<T, TR>>} The enhanced machine with an api property
 * 
 * @example
 * ```ts
 * const enhancedTodoStore = withApi(todoStore);
 * enhancedTodoStore.api.addTodo("New task");
 * ```
 */
export function withApi<
  T,
  TR extends StoreTransitionRecord<T> = StoreTransitionRecord<T>
>(machine: StoreMachine<T, TR>): WithApi<StoreMachine<T, TR>> {
  const enhanced = machine as WithApi<StoreMachine<T, TR>>;
  if (enhanced.api) {
    return enhanced;
  }
  
  return Object.assign(machine, {
    api: storeApi(machine),
  }) as WithApi<StoreMachine<T, TR>>;
}
