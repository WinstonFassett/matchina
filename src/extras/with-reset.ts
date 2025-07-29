import { FactoryState } from "../factory-state";
import type { StateMachine } from "../state-machine";

/**
 * Resets a state machine to a given state by performing a transition.
 *
 * @template T - Type of StateMachine
 * @param machine - The state machine instance (optionally with a reset method)
 * @param state - The state to reset to
 * @param type - The transition type (default: "reset")
 */
export const resetMachine = <T extends StateMachine<any>>(
  machine: T & Partial<{ reset: () => void }>,
  state: FactoryState<ReturnType<T["getState"]>>,
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
 *
 * @template T - Type of StateMachine
 * @param machine - The state machine instance
 * @param state - The state to reset to
 * @returns A function that resets the machine to the specified state
 */
export const createReset =
  <T extends StateMachine<any>>(
    machine: T,
    state: FactoryState<ReturnType<T["getState"]>>
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
 */
export const withReset = <T extends StateMachine<any>>(
  machine: T & Partial<{ reset: () => void }>,
  state: FactoryState<ReturnType<T["getState"]>>
) => {
  if (!machine.reset) {
    machine.reset = createReset(machine, state);
  }
  return machine as T & { reset: typeof machine.reset };
};
