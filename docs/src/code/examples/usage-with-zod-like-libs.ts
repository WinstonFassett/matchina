import { eventApi, createMachine, defineStates, matchina } from "matchina";
// For development, use relative path
import { defineZodStates } from "../../../../src/integrations/zod";
// In production, this would be: import { defineZodStates } from "matchina/zod";
import { z } from "zod";

// Example Zod schemas for states
const IdleSchema = z.object({});
const LoadingSchema = z.object({ progress: z.number() });
const ErrorSchema = z.object({ message: z.string() });

const states = defineStates({
  // Idle: () => Object.assign(IdleSchema.parse({}) as z.infer<typeof IdleSchema>, { key: "Idle" }),
  // Loading: (progress: number) => Object.assign(LoadingSchema.parse({ progress }) as z.infer<typeof LoadingSchema>, { key: "Loading" }),
  // Error: Object.assign((message: string) => ErrorSchema.parse({ message }) as z.infer<typeof ErrorSchema>, { key: "Error" }),
  // Idle: () => ({}),
  // Loading: (progress: number) => ({ progress }),
  // Error: (message: string) => ({ message }),
  Idle: () => IdleSchema.parse({}) as z.infer<typeof IdleSchema>,
  Loading: (progress: number) =>
    LoadingSchema.parse({ progress }) as z.infer<typeof LoadingSchema>,
  Error: (message: string) =>
    ErrorSchema.parse({ message }) as z.infer<typeof ErrorSchema>,
} as const);

const m1 = createMachine(
  states,
  {
    Idle: {
      start: "Loading",
    },
    Loading: {
      success: "Idle",
      error: "Error",
    },
  },
  "Idle"
);
// m1.send('error', 1) // invalid
m1.send("error", "1"); // valid
// m1.send('error') // invalid -- error required

const m1Api = eventApi(m1);
m1Api.success();
m1Api.error("An error occurred"); // valid
// m1Api.error(); // invalid -- error required

const m2 = matchina(
  states,
  {
    Idle: {
      start: "Loading",
    },
    Loading: {
      success: "Idle",
      error: "Error",
    },
  },
  "Idle"
);
// m2.send('error', 1) // invalid
m2.send("error", "1"); // valid
// m2.send('error') // invalid -- error required
m2.success();
m2.error("An error occurred"); // valid
// m2.error(); // invalid -- error required

// BEFORE: Verbose way to create state factories with Zod validation
const states2 = defineStates({
  Idle: () => IdleSchema.parse({}) as z.infer<typeof IdleSchema>,
  Loading: (data: z.infer<typeof LoadingSchema>) => LoadingSchema.parse(data),
  Error: (data: z.infer<typeof ErrorSchema>) => ErrorSchema.parse(data),
} as const);

// This will now show a type error for the misspelled property
// const loading2 = states2.Loading({ proffffgress: 4 });

// AFTER: Using the new defineZodStates helper

const states3 = defineZodStates({
  Idle: IdleSchema,
  Loading: LoadingSchema,
  Error: ErrorSchema,
});

// Now we get the same type checking but with much cleaner code
// This will show a type error for the misspelled property
// const loading3 = states3.Loading({ proffffgress: 5 });
// Correct usage would be:
// const loading3 = states3.Loading({ progress: 5 });

const machine2 = matchina(
  states3,
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
// machine2.start({}); // Error: missing progress property
machine2.start({ progress: 0 }); // Valid

// machine2.send("start", {}); // Error: missing progress property
machine2.send("start", { progress: 1 }); // Valid

// machine2.send("error", { message: "An error occurred" }); // Valid

// machine2.send("retry", 1,2,3); // Error: too many arguments
machine2.send("retry"); // Valid

// Define and destructure states with inline schemas
const { Idle, Loading, Error } = defineZodStates({
  Idle: z.object({}),
  Loading: z.object({ progress: z.number() }),
  Error: z.object({ message: z.string() }),
});

// Define and destructure transition schemas
const { start, success, error, retry } = {
  start: z.function().args(z.number()),
  success: z.function().args(),
  error: z.function().args(z.string()),
  retry: z.function().args(),
};

// Create machine with validated transitions
const m3 = matchina(
  { Idle, Loading, Error },
  {
    Idle: {
      start: start.implement((progress) => Loading({ progress })),
    },
    Loading: {
      success: success.implement(() => Idle()),
      error: error.implement((message) => Error({ message })),
    },
    Error: {
      retry: retry.implement(() => Idle()),
    },
  },
  Idle()
);

// Usage:
m3.start(0.5); // Valid
// m3.start("invalid"); // Runtime error: Expected number, received string
m3.error("An error occurred"); // Valid
m3.success(); // Valid
m3.retry(); // Valid
