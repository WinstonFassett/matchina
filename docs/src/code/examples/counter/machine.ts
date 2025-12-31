import { createMachine, defineStates, setup, transitionHooks, atom } from "matchina";

export const createCounterMachine = () => {
  const states = defineStates({
    Active: undefined,
  });

  const store = atom({ count: 0 });

  const machine = createMachine(
    states,
    {
      Active: {
        increment: "Active",
        decrement: "Active",
        reset: "Active",
      },
    },
    "Active"
  );

  setup(machine)(
    transitionHooks(
      { type: "increment", effect: () => store.update(s => ({ count: s.count + 1 })) },
      { type: "decrement", effect: () => store.update(s => ({ count: s.count - 1 })) },
      { type: "reset", effect: () => store.set({ count: 0 }) },
    )
  );

  return Object.assign(machine, { store });
};

export type CounterMachine = ReturnType<typeof createCounterMachine>;
