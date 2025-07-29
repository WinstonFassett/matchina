import {
  createApi,
  createMachine,
  defineStates,
  matchina
} from "matchina";
// For development, use relative path
import { defineValibotStates } from "../../../../src/integrations/valibot";
// In production, this would be: import { defineValibotStates } from "matchina/valibot";
import * as v from 'valibot';

// Example Valibot schemas for states
const IdleSchema = v.object({});
const LoadingSchema = v.object({ progress: v.number() });
const ErrorSchema = v.object({ message: v.string() });

// BEFORE: Verbose way to create state factories with Valibot validation
const states1 = defineStates({
  Idle: () => v.parse(IdleSchema, {}) as v.InferOutput<typeof IdleSchema>,
  Loading: (data: v.InferOutput<typeof LoadingSchema>) => v.parse(LoadingSchema, data),
  Error: (data: v.InferOutput<typeof ErrorSchema>) => v.parse(ErrorSchema, data),
} as const);

// This will show a type error for the misspelled property
// const loading1 = states1.Loading({ proffffgress: 4 });

// AFTER: Using the new defineValibotStates helper
const states2 = defineValibotStates({
  Idle: IdleSchema,
  Loading: LoadingSchema,
  Error: ErrorSchema
});

// Now we get the same type checking but with much cleaner code
// This will show a type error for the misspelled property
// const loading2 = states2.Loading({ proffffgress: 5 });
// Correct usage would be:
const loading2 = states2.Loading({ progress: 0.5 });

const machine = matchina(
  states2,
  {
    Idle: {
      start: "Loading",
    },
    Loading: {
      success: 'Idle',
      error: 'Error'
    },
    Error: {
      retry: 'Idle'
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
