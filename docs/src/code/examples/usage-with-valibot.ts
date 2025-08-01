import { defineStates, matchina } from "matchina";
// For development, use relative path
import { defineValibotStates } from "../../../../src/integrations/valibot";
// In production, this would be: import { defineValibotStates } from "matchina/valibot";
import * as v from "valibot";

// Example Valibot schemas for states
const IdleSchema = v.object({});
const LoadingSchema = v.object({ progress: v.number() });
const ErrorSchema = v.object({ message: v.string() });

// BEFORE: Verbose way to create state factories with Valibot validation
export const states1 = defineStates({
  Idle: () => v.parse(IdleSchema, {}) as v.InferOutput<typeof IdleSchema>,
  Loading: (data: v.InferOutput<typeof LoadingSchema>) =>
    v.parse(LoadingSchema, data),
  Error: (data: v.InferOutput<typeof ErrorSchema>) =>
    v.parse(ErrorSchema, data),
} as const);

// This will show a type error for the misspelled property
// const loading1 = states1.Loading({ proffffgress: 4 });

// AFTER: Using the new defineValibotStates helper
const states2 = defineValibotStates({
  Idle: IdleSchema,
  Loading: LoadingSchema,
  Error: ErrorSchema,
});

// Now we get the same type checking but with much cleaner code
// This will show a type error for the misspelled property
// const loading2 = states2.Loading({ proffffgress: 5 });
// Correct usage would be:
// const loading2 = states2.Loading({ proggress: 0.5 });

const machine = matchina(
  states2,
  {
    Idle: {
      start: "Loading",
    },
    Loading: {
      success: "Idle",
      error: "Error",
    },
    Error: {
      retry: "Idle",
    },
  },
  states2.Idle()
);

// These now properly type-check:
// machine.start({}); // Error: missing progress property
machine.start({ progress: 0 }); // Valid

// machine.send("start", {}); // Error: missing progress property
machine.send("start", { progress: 1 }); // Valid

machine.send("error", { message: "An error occurred" }); // Valid

// machine.send("retry", 1,2,3); // Error: too many arguments
machine.send("retry"); // Valid

// Helper to create a validated transition function with overloads
// Overload for transitions with no arguments
function vTransition<R>(fn: () => R): () => R;
// Overload for transitions with arguments
function vTransition<I, O, R>(
  schema: v.BaseSchema<I, O, any>,
  fn: (arg: O) => R
): (arg: I) => R;
// Implementation
function vTransition<I, O, R>(
  schemaOrFn: v.BaseSchema<I, O, any> | (() => R),
  fn?: (arg: O) => R
): any {
  // Case 1: No arguments (just a function)
  if (typeof schemaOrFn === "function") {
    return schemaOrFn;
  }
  // Case 2: With arguments (schema + function)
  return (arg: I): R => {
    const validatedArg = v.parse(schemaOrFn, arg);
    return (fn as (arg: O) => R)(validatedArg);
  };
}

const { Idle, Loading, Error } = defineValibotStates({
  Idle: v.object({}),
  Loading: v.object({ progress: v.number() }),
  Error: v.object({ message: v.string() }),
});

// Define and destructure transition schemas for better readability
const transitions = {
  start: (progress: number) => Loading({ progress }),
  success: () => Idle(),
  error: (message: string) => Error({ message }),
  retry: () => Idle(),
};

// Create machine with validated transitions
const m3 = matchina(
  { Idle, Loading, Error },
  {
    Idle: {
      start: vTransition(v.number(), transitions.start),
    },
    Loading: {
      success: vTransition(transitions.success),
      error: vTransition(v.string(), transitions.error),
    },
    Error: {
      retry: vTransition(transitions.retry),
    },
  },
  Idle()
);

// Usage examples:
m3.start(42); // Valid
// m3.start("wrong"); // Runtime error: Expected number, received string
m3.error("Something went wrong"); // Valid
m3.success(); // Valid
m3.retry(); // Valid
