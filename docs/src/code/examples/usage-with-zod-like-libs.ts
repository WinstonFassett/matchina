import {
  createMachine,
  defineStates,
  matchina
} from "matchina";
import { z } from "zod";

// Example Zod schemas for states
const IdleSchema = z.object({});
const LoadingSchema = z.object({ progress: z.number() });
const ErrorSchema = z.object({ message: z.string() });

const states = defineStates({
  // Idle: () => Object.assign(IdleSchema.parse({}) as z.infer<typeof IdleSchema>, { key: "Idle" }),
  // Loading: (progress: number) => Object.assign(LoadingSchema.parse({ progress }) as z.infer<typeof LoadingSchema>, { key: "Loading" }),
  // Error: Object.assign((message: string) => ErrorSchema.parse({ message }) as z.infer<typeof ErrorSchema>, { key: "Error" }),
  Idle: () => ({}),
  Loading: (progress: number) => ({ progress }),
  Error: (message: string) => ({ message }),
} as const);

const m1 = createMachine(
  states,
  {
    Idle: {
      start: "Loading",
    },
    Loading: {
      success: "Idle",
      error: "Error"
    }
  },  
  "Idle"
);
// m1.send('error', 1) // invalid
m1.send('error', '1') // valid
// m1.send('error') // invalid -- error required


const m2 = matchina(
  states,
  {
    Idle: {
      start: "Loading",
    },
    Loading: {
      success: "Idle",
      error: "Error"
    }
  },  
  "Idle"
);
// m2.send('error', 1) // invalid
m2.send('error', '1') // valid
// m2.send('error') // invalid -- error required
m2.success();
m2.error("An error occurred");


const states2 = defineStates({
  Idle: IdleSchema.parse,
  Loading: LoadingSchema.parse,
  Error: ErrorSchema.parse,
});

const loading2 = states2.Loading({ prodgress: 4 })

const machine2 = matchina(
  states2,
  {
  Idle: {
    start: () => states.Loading(0),
  },
  Loading: {
    success: () => states.Idle(),
    error: (message: string) => states.Error(message),
  },
  Error: {
    retry: () => states.Idle(),
  },    
  },
  states2.Idle({})  
);

