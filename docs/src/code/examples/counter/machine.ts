import {
  createMachine,
  defineStates,
  createStoreMachine,
  setup,
  effect,
} from "matchina";

interface CounterState {
  count: number;
}

export const createCounterMachine = () => {
  const states = defineStates({
    Active: undefined,
  });

  const store = createStoreMachine<CounterState>({ count: 0 }, {
    increment: () => (change) => ({ count: change.from.count + 1 }),
    decrement: () => (change) => ({ count: change.from.count - 1 }),
    reset: () => () => ({ count: 0 }),
  });

  const machine = createMachine(
    states,
    {
      Active: {
        increment: "Active",
        decrement: "Active",
        reset: "Active",
      },
    },
    states.Active()
  );

  setup(machine)(
    effect((ev) => {
      if (ev.type === "increment") store.dispatch("increment");
      if (ev.type === "decrement") store.dispatch("decrement");
      if (ev.type === "reset") store.dispatch("reset");
    })
  );

  return Object.assign(machine, { store });
};

export type CounterMachine = ReturnType<typeof createCounterMachine>;
