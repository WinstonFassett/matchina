/**
 * Represents a state object with a unique key. *
 * @source
 * @see {@link defineStates} - for creating type-safe state factories (uses matchboxFactory)
 * @see {@link createMachine} - for building state machines from state factories
 * @see {@link FactoryMachine} - for the main state machine type
 * These types are the underpinnings of the library, enabling type inference and state management
 * throughout factory machines. The implementation leverages matchbox factories for dynamic and type-safe
 * state construction and transitions.
 */
export interface KeyedState {
  key: string;
}
/**
 * A factory object mapping state keys to state creator functions.
 * Each function returns a State instance (optionally with additional properties).
 *
 * @source This interface is useful for defining a set of states in a state machine,
 * allowing for dynamic state creation and management. It ensures that each state can be
 * uniquely identified by its key, enabling type-safe transitions and state handling.
 * @see {@link defineStates} - for creating type-safe state factories (uses matchboxFactory)
 * @see {@link createMachine} - for building state machines from state factories
 * @see {@link FactoryMachine} - for the main state machine type
 *
 * These types are the underpinnings of the library, enabling type inference and state management
 * throughout factory machines. The implementation leverages matchbox factories for dynamic and type-safe
 * state construction and transitions.
 */

export interface KeyedStateFactory {
  [key: string]: (...args: any[]) => KeyedState;
} /**
 * Infers the return type of a state factory function for a given key.
 * Used to type-check state objects created by a StateFactory.
 *
 * @template States - The StateFactory type
 * @template StateKey - The key of the state to infer (defaults to all keys)
 * @source This utility is useful for ensuring that state objects created by a StateFactory
 * conform to the expected structure, allowing for type-safe state management in applications.
 * It helps maintain consistency across state definitions and ensures that state transitions
 * are handled correctly.
 * @see {@link defineStates} - for creating type-safe state factories (uses matchboxFactory)
 * @see {@link createMachine} - for building state machines from state factories
 * @see {@link FactoryMachine} - for the main state machine type
 *
 * These types are the underpinnings of the library, enabling type inference and state management
 * throughout factory machines. The implementation leverages matchbox factories for dynamic and type-safe
 * state construction and transitions.
 */

/**
 * @interface
 * FactoryKeyedState defines a state object with a key and data
 * that was created by a KeyedStateFactory.
 * * @template States - The KeyedStateFactory type
 * * @template StateKey - The key of the state to infer (defaults to all keys
 */
export type FactoryKeyedState<
  States extends KeyedStateFactory,
  StateKey extends keyof States = keyof States,
> = ReturnType<States[StateKey]>;
