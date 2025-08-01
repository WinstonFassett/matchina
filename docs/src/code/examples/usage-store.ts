import { createStoreMachine } from "matchina";

// Example with proper type checking
const store = createStoreMachine(0, {
  increment:
    (amt: number = 1) =>
    (change) =>
      change.from + amt,
  decrement:
    (amt: number = 1) =>
    (change) =>
      change.from - amt,
  set: (next: number) => next,
  reset: () => 0,
});
// These calls are now properly type-checked:
store.dispatch("increment"); // Works with default parameter

store.dispatch("increment", 5); // Works with explicit parameter

store.dispatch("decrement"); // Works with default parameter

store.dispatch("set", 42); // Requires a number parameter

store.dispatch("reset"); // No parameters required

// These would cause type errors:
// store.dispatch("increment", "not a number"); // Type error: expected number
// store.send("set"); // Type error: missing required parameter
// store.send("unknown"); // Type error: unknown event type
console.log(store.getState());
