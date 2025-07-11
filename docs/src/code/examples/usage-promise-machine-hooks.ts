import {
  createPromiseMachine,
  effect,
  enter,
  leave,
  methodEnhancer,
  onExecute,
  setup,
} from "matchina";

// --- 1. Create a promise machine for async addition ---
const adder = createPromiseMachine(
  (a: number, b: number) =>
    new Promise<number>((resolve) => setTimeout(() => resolve(a + b), 500)),
);

// Everything below here is strongly typed and checked by TypeScript

// --- 2. Add lifecycle hooks ---
setup(adder)(
  onExecute((execute) => (a: number, b: number) => {
    if (a < 0 || b < 0) {
      throw new Error("Both numbers must be non-negative.");
    }
    return execute(a, b);
  }),
  enter(
    (ev) => ev.to.is("Pending") && console.log("Started addition:", ev.to.data),
  ),
  leave((ev) => ev.from.is("Pending") && console.log("Leaving pending state")),
  effect(
    (ev) =>
      ev.type === "resolve" &&
      console.log("Promise resolved with:", ev.to.data),
  ),
);

// --- 3. Use the machine ---

// Trigger addition and await result
const done = adder.execute(2, 3);
await done;

// Alternative: Await promise from state (if currently pending)
const state = adder.getState();
if (state.is("Pending")) await state.data.promise;

// Pattern match on state for messaging
const message = adder.getState().match({
  Idle: () => "Ready to add.",
  Pending: (params) => `Adding: ${params}`,
  Resolved: (result) => `Result: ${result}`,
  Rejected: (error) => `Error: ${error}`,
});
