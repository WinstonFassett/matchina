import { FactoryState } from "../factory-state";
import type { StateMachine } from "../state-machine";

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

export const createReset =
  <T extends StateMachine<any>>(
    machine: T,
    state: FactoryState<ReturnType<T["getState"]>>
  ) =>
  () => {
    resetMachine(machine, state);
  };

export const withReset = <T extends StateMachine<any>>(
  machine: T & Partial<{ reset: () => void }>,
  state: FactoryState<ReturnType<T["getState"]>>
) => {
  if (!machine.reset) {
    machine.reset = createReset(machine, state);
  }
  return machine as T & { reset: typeof machine.reset };
};
