/**
 * Represents a state object with a unique key.
 */
export interface State {
  key: string;
}

/**
 * A factory object mapping state keys to state creator functions.
 * Each function returns a State instance (optionally with additional properties).
 */
export interface StateFactory {
  [key: string]: (...args: any[]) => State;
}

/**
 * Infers the return type of a state factory function for a given key.
 * Used to type-check state objects created by a StateFactory.
 *
 * @template States - The StateFactory type
 * @template StateKey - The key of the state to infer (defaults to all keys)
 */
export type FactoryState<
  States extends StateFactory,
  StateKey extends keyof States = keyof States
> = ReturnType<States[StateKey]>;
