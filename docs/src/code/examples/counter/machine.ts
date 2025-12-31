import { createMachine, defineStates, setup, effect, createStoreMachine, addStoreApi, withSubscribe } from "matchina";

const createCounterStore = () => {
  const store = createStoreMachine({ count: 0 }, {
    increment: () => (change) => ({ count: change.from.count + 1 }),
    decrement: () => (change) => ({ count: change.from.count - 1 }),
    reset: () => () => ({ count: 0 }),
  });
  return addStoreApi(withSubscribe(store));
};

export const createCounterMachine = () => {
  const states = defineStates({
    Active: undefined,
    Inactive: undefined,
  });

  const store = createCounterStore();

  const machine = createMachine(
    states,
    {
      Active: {
        increment: "Active",
        decrement: "Active",
        reset: "Active",
        deactivate: "Inactive",
      },
      Inactive: {
        activate: "Active",
      },
    },
    "Active"
  );

  setup(machine)(
    effect((ev) => {
      if (ev.to.is("Active") && ev.type in store.api) {
        (store.api as any)[ev.type]();
      }
    })
  );

  return Object.assign(machine, { store });
};

export type CounterMachine = ReturnType<typeof createCounterMachine>;
