import { createMachine, defineStates, onLifecycle, withApi } from "matchina";

export const createCounterMachine = () => {
  const states = defineStates({
    Active: (count: number = 0) => ({ count }),
  });

  // Create a machine with proper transitions
  const machine = withApi(
    createMachine(
      states,
      {
        Active: {
          increment: "Active",
          decrement: "Active",
          reset: () => () => states.Active(0),
        },
      },
      states.Active()
    )
  );
  onLifecycle(machine, {
    Active: {
      on: {
        increment: {
          effect: (ev) => {
            ev.to.data.count = ev.from.data.count + 1;
          },
        },
        decrement: {
          effect: (ev) => {
            ev.to.data.count = ev.from.data.count - 1;
          },
        },
      },
    },
  });
  return machine;
};
export type CounterMachine = ReturnType<typeof createCounterMachine>;
