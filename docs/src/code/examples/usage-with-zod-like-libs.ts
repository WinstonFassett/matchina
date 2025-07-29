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
  Idle: () => IdleSchema.parse({}),
  Loading: (progress: number) => LoadingSchema.parse({ progress }),
  Error: (message: string) => ErrorSchema.parse({ message }),
});

const machine = matchina(
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

machine.start('8');
machine.send("start");
machine.success();
machine.error("An error occurred");


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

