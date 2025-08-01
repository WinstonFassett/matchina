import { FactoryKeyedState } from "../state-keyed";
import type { StateMachine } from "../state-machine";

/**
 * Resets a state machine to a given state by performing a transition.
 *
 * @template T - Type of StateMachine
 * @param machine - The state machine instance (optionally with a reset method)
 * @param state - The state to reset to
 * @param type - The transition type (default: "reset")
 * @source This function is useful for programmatically resetting a state machine to a known state,
 * enabling repeatable workflows, error recovery, or test setup. It provides a generic way to trigger
 * a reset transition and is foundational for adding reset capabilities to state machines.
 */
export const resetMachine = <T extends StateMachine<any>>(
  machine: T & Partial<{ reset: () => void }>,
  state: FactoryKeyedState<ReturnType<T["getState"]>>,
  type = "reset"
) => {
  const before = machine.getChange();
  machine.transition({
    from: before.to,
    type,
    to: state,
  } as any);
};

/**
 * Creates a reset function for a state machine, resetting it to a given state.
 * Usage:
 * ```ts
 * const reset = createReset(machine, "Idle");
 * reset(); // Resets the machine to the "Idle" state
 * ```
 * @template T - Type of StateMachine
 * @param machine - The state machine instance
 * @param state - The state to reset to
 * @returns A function that resets the machine to the specified state
 * @source This function is useful for generating a reusable reset function for a state machine,
 * allowing you to reset the machine to a specific state on demand. It is commonly used in scenarios
 * where you want to expose a reset API or automate state restoration.
 */
export const createReset =
  <T extends StateMachine<any>>(
    machine: T,
    state: FactoryKeyedState<ReturnType<T["getState"]>>
  ) =>
  () => {
    resetMachine(machine, state);
  };

/**
 * Adds a reset method to a state machine if not already present.
 *
 * @template T - Type of StateMachine
 * @param machine - The state machine instance (optionally with a reset method)
 * @param state - The state to reset to
 * @returns The machine with a reset method
 * @source This function is useful for extending state machines with a reset capability,
 * making it easy to restore the machine to a known state. It is foundational for workflows
 * that require repeatable initialization, error recovery, or test setup.
 */
export const withReset = <T extends StateMachine<any>>(
  machine: T & Partial<{ reset: () => void }>,
  state: FactoryKeyedState<ReturnType<T["getState"]>>
) => {
  if (!machine.reset) {
    machine.reset = createReset(machine, state);
  }
  return machine as T & { reset: typeof machine.reset };
};
