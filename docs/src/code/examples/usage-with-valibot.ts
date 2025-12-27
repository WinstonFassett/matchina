import { createMachine, defineStates } from "matchina";
// For development, use relative path
import { defineValibotStates } from "matchina/valibot";
// In production, this would be: import { defineValibotStates } from "matchina/valibot";
import * as v from "valibot";

// Example Valibot schemas for states
const LoadingSchema = v.object({ progress: v.number() });
const ErrorSchema = v.object({ message: v.string() });

// Approach 1: Manual schema validation (verbose)
const manualStates = defineStates({
  Idle: () => undefined,
  Loading: (progress: number) => v.parse(LoadingSchema, { progress }),
  Error: (message: string) => v.parse(ErrorSchema, { message }),
} as const);

// Approach 2: Using defineValibotStates helper (cleaner)
const valibotStates = defineValibotStates({
  Idle: v.object({}),
  Loading: LoadingSchema,
  Error: ErrorSchema,
});

// Create machine with manually validated states
const manualMachine = createMachine(
  manualStates,
  {
    Idle: { start: "Loading" },
    Loading: { 
      success: "Idle",
      error: "Error" 
    },
    Error: { retry: "Idle" },
  },
  manualStates.Idle()
);

// Create machine with defineValibotStates (recommended approach)
const valibotMachine = createMachine(
  valibotStates,
  {
    Idle: { start: "Loading" },
    Loading: { 
      success: "Idle",
      error: "Error" 
    },
    Error: { retry: "Idle" },
  },
  valibotStates.Idle()
);

// Both machines work the same way, but valibotMachine has cleaner state definitions
manualMachine.send("start", 50); // Valid
valibotMachine.send("start", { progress: 50 }); // Valid

// Type errors are caught at compile time:
// manualMachine.send("start", "invalid"); // Error: Argument of type 'string' is not assignable to parameter of type 'number'
// valibotMachine.send("start", "invalid"); // Error: Argument of type 'string' is not assignable to parameter of type 'number'

// Runtime validation happens automatically with defineValibotStates
// If you try to create invalid state data, Valibot will throw:
try {
  valibotStates.Loading({ progress: 50 }); // Valid
  // valibotStates.Loading({ progress: "invalid" }); // Runtime error
} catch (error) {
  if (error instanceof Error) {
    console.log("Valibot validation error:", error.message);
  }
}

// Usage with full type safety and runtime validation:
// Note: Valibot integration works best with basic transitions
// For complex validation, consider using Zod instead
valibotMachine.send("start", { progress: 0.5 }); // Valid
// valibotMachine.send("start", { progress: "invalid" }); // Runtime error
valibotMachine.send("error", { message: "An error occurred" }); // Valid
valibotMachine.send("success"); // Valid
valibotMachine.send("retry"); // Valid
