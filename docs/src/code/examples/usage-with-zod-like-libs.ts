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
      error: "Error",
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
      error: "Error",
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

// Note: wrapping matchina transitions with z.function().implement() is not
// currently supported — Zod's wrapped function type does not satisfy
// FactoryMachineTransition. Use matchina's built-in type safety instead,
// and call Zod validation inside the state factory functions (see zodStates above).
const _validatedMachine = matchina(
  zodStates,
  {
    Idle: { start: (progress: number) => zodStates.Loading(progress) },
    Loading: {
      success: () => zodStates.Idle(),
      error: (message: string) => zodStates.Error(message),
    },
    Error: { retry: () => zodStates.Idle() },
  },
  manualStates.Idle()
);

// Usage with full type safety and runtime validation:
_validatedMachine.start(0.5); // Valid
// _validatedMachine.start("invalid"); // Error: Argument of type 'string' is not assignable to parameter of type 'number'
_validatedMachine.error("An error occurred"); // Valid
_validatedMachine.success(); // Valid
_validatedMachine.retry(); // Valid
