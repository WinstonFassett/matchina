import { createPromiseMachine, setup, effect, guard, enter, leave } from "matchina";

// --- 1. Create a promise machine for async addition ---
const adder = createPromiseMachine(
  (a: number, b: number) => new Promise<number>(resolve => setTimeout(() => resolve(a + b), 500))
);

// Everything below here is strongly typed and checked by TypeScript

// --- 2. Add lifecycle hooks ---
setup(adder)(
  // Only allow non-negative numbers
  guard(ev => ev.type !== "executing" || ev.to.data.params[0] >= 0),
  // Log when addition starts
  enter(ev => ev.to.is("Pending") && console.log("Started addition:", ev.to.data)),
  // Log when leaving pending state
  leave(ev => ev.from.is("Pending") && console.log("Leaving pending state")),
  // Log when promise resolves
  effect(ev => ev.type === "resolve" && console.log("Promise resolved with:", ev.to.data))
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
  Idle:    ()      => "Ready to add.",
  Pending: params  => `Adding: ${params}`,
  Resolved: result => `Result: ${result}`,
  Rejected: error  => `Error: ${error}`,
});
