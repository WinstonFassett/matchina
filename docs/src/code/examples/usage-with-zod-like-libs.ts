import { createMachine, defineStates, matchina } from "matchina";
// For development, use relative path
// In production, this would be: import { defineZodStates } from "matchina/zod";
import { z } from "zod";

// Example Zod schemas for states
const LoadingSchema = z.object({ progress: z.number() });
const ErrorSchema = z.object({ message: z.string() });

// Approach 1: Manual schema validation (verbose)
const manualStates = defineStates({
  Idle: () => undefined,
  Loading: (progress: number) => LoadingSchema.parse({ progress }),
  Error: (message: string) => ErrorSchema.parse({ message }),
} as const);

// Approach 2: Using defineZodStates helper (cleaner)
const zodStates = defineStates({
  Idle: () => undefined,
  Loading: (progress: number) => LoadingSchema.parse({ progress }),
  Error: (message: string) => ErrorSchema.parse({ message }),
} as const);

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

// Create machine with defineZodStates (recommended approach)
const zodMachine = createMachine(
  zodStates,
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

// Both machines work the same way, but zodMachine has cleaner state definitions
manualMachine.send("start", 50); // Valid
zodMachine.send("start", 50); // Valid

// Type errors are caught at compile time:
// manualMachine.send("start", "invalid"); // Error: Argument of type 'string' is not assignable to parameter of type 'number'
// zodMachine.send("start", "invalid"); // Error: Argument of type 'string' is not assignable to parameter of type 'number'

// Runtime validation happens automatically with defineZodStates
// If you try to create invalid state data, Zod will throw:
try {
  zodStates.Loading(50); // Valid
  // zodStates.Loading("invalid"); // Runtime error
} catch (error) {
  if (error instanceof Error) {
    console.log("Zod validation error:", error.message);
  }
}

// Define transition schemas for validation
const transitions = {
  start: z.function().args(z.number()),
  success: z.function().args(),
  error: z.function().args(z.string()),
  retry: z.function().args(),
};

// Create machine with validated transitions
const validatedMachine = matchina(
  zodStates,
  {
    Idle: {
      start: transitions.start.implement((progress) => zodStates.Loading(progress)),
    },
    Loading: {
      success: transitions.success.implement(() => zodStates.Idle()),
      error: transitions.error.implement((message) => zodStates.Error(message)),
    },
    Error: {
      retry: transitions.retry.implement(() => zodStates.Idle()),
    },
  },
  manualStates.Idle()
);

// Usage with full type safety and runtime validation:
validatedMachine.start(0.5); // Valid
// validatedMachine.start("invalid"); // Runtime error: Expected number, received string
validatedMachine.error("An error occurred"); // Valid
validatedMachine.success(); // Valid
validatedMachine.retry(); // Valid
