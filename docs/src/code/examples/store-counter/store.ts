import { createStoreMachine } from "matchina";

export function createCounterStore(initialValue = 0) {
  return createStoreMachine(initialValue, {
    increment: (amt = 1) => (change) => change.from + amt,
    decrement: (amt = 1) => (change) => change.from - amt,
    set: (value: number) => value,
    reset: () => 0,
  });
}

export type CounterStore = ReturnType<typeof createCounterStore>;
