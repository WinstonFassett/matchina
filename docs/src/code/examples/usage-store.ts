import { createStoreMachine } from "../../../../src/store-machine";

// Example with proper type checking
const store = createStoreMachine(0, {
  increment: (amt: number = 1) => (change) => change.from + amt,
  decrement: (amt: number = 1) => (change) => change.from - amt,
  set: (next: number) => next,
  reset: () => 0,
});
// These calls are now properly type-checked:
store.send("increment"); // Works with default parameter

store.send("increment", 5); // Works with explicit parameter

store.send("decrement"); // Works with default parameter

store.send("set", 42); // Requires a number parameter

store.send("reset"); // No parameters required

// These would cause type errors:
// store.send("increment", "not a number"); // Type error: expected number
// store.send("set"); // Type error: missing required parameter
// store.send("unknown"); // Type error: unknown event type
console.log(store.getState());
