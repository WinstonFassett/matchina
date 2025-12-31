import { createMachine, defineStates, setup, effect, createStoreMachine, addStoreApi, withSubscribe } from "matchina";

export const createCounterMachine = () => {
  const states = defineStates({
    Active: undefined,
    Inactive: undefined,
  });

  const store = createStoreMachine({ count: 0 }, {
    increment: () => (change) => ({ count: change.from.count + 1 }),
    decrement: () => (change) => ({ count: change.from.count - 1 }),
    reset: () => () => ({ count: 0 }),
  });
  const storeWithApi = addStoreApi(withSubscribe(store));

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
      if (ev.to.is("Active") && ev.type in storeWithApi.api) {
        (storeWithApi.api as any)[ev.type]();
      }
    })
  );

  // Encapsulate store and expose methods on machine
  const enhancedMachine = Object.assign(machine, { 
    store: storeWithApi,
    increment: () => storeWithApi.api.increment(),
    decrement: () => storeWithApi.api.decrement(),
    reset: () => storeWithApi.api.reset(),
    getCount: () => storeWithApi.getState().count,
  });

  return enhancedMachine;
};

export type CounterMachine = ReturnType<typeof createCounterMachine>;
