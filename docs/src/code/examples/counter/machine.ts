import { createMachine, defineStates, withApi } from "@lib/src";

// ---cut---

export const createCounterMachine = () => {
  const states = defineStates({
    Active: (count: number = 0) => ({ count }),
  });
  
  // Create a machine with proper transitions
  return withApi(createMachine(
    states,
    {
      Active: { 
        increment: () => (ev) => states.Active(ev.from.data.count + 1),
        decrement: () => (ev) => states.Active(ev.from.data.count - 1),
        reset: () => () => states.Active(0)
      },
    },
    states.Active()
  ));
};
