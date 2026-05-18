import { createMachine, defineStates } from "matchina";
// For development, use relative path
// import { defineValibotStates } from "matchina";
// In production, this would be: import { defineValibotStates } from "matchina";
import * as v from "valibot";

// Example Valibot schemas for states
const LoadingSchema = v.object({ progress: v.number() });
const ErrorSchema = v.object({ message: v.string() });

// Approach 1: Manual schema validation (verbose)
const manualStates = defineStates({
  Idle: () => undefined,
  Loading: (progress: number) => v.parse(LoadingSchema, { progress }),
  Error: (message: string) => v.parse(ErrorSchema, { message }),
  Success: (data: any) => data,
});

// Approach 2: Using defineValibotStates (when available)
// const valibotStates = defineValibotStates({
//   Idle: v.undefined(),
//   Loading: LoadingSchema,
//   Error: ErrorSchema,
//   Success: v.any(),
// });

// Create machine with manually validated states
const manualMachine = createMachine(
  manualStates,
  {
    Idle: { start: "Loading" },
    Loading: {
      success: "Success",
      error: "Error",
    },
    Error: { retry: "Idle" },
  },
  manualStates.Idle()
);

export { manualMachine, LoadingSchema, ErrorSchema };

// Usage examples:
console.log("Manual machine created successfully");
// console.log("Valibot machine created successfully");

// Example state transitions
// manualMachine.send("start");
// valibotMachine.send("start");

// Example state validation
// manualMachine.send("success", { data: "result" });
// valibotStates.Loading({ progress: 50 }); // Valid
// valibotStates.Error({ message: "error" }); // Validle time:
// manualMachine.send("start", "invalid"); // Error: Argument of type 'string' is not assignable to parameter of type 'number'
// valibotMachine.send("start", "invalid"); // Error: Argument of type 'string' is not assignable to parameter of type 'number'

// Runtime validation happens automatically with defineValibotStates
// If you try to create invalid state data, Valibot will throw:
try {
  // manualStates.Loading({ progress: 50 }); // This would be an error - Loading expects number
  // With manual states, you call the state function directly:
  manualStates.Loading(50); // Valid - passes progress as number
  // valibotStates.Loading({ progress: 50 }); // Valid - valibot validates object
  // valibotStates.Loading({ progress: "invalid" }); // Runtime error
} catch (error) {
  if (error instanceof Error) {
    console.log("Valibot validation error:", error.message);
  }
}

// Usage with full type safety and runtime validation:
// Note: Valibot integration works best with basic transitions
// For complex validation, consider using Zod instead

// Example usage with valibotMachine (when defineValibotStates is available):
// valibotMachine.send("start", { progress: 0.5 }); // Valid
// valibotMachine.send("error", { message: "An error occurred" }); // Valid
// valibotMachine.send("success"); // Valid
// valibotMachine.send("retry"); // Valid
