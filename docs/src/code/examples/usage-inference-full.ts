// @noErrors
import { defineStates, createMachine, zen } from "matchina";

// ✅ GOOD PRACTICE: Full type inference with inline definitions
const states = defineStates({
  Idle: undefined,
  Playing: (trackId: string) => ({ trackId }),
  Paused: (trackId: string) => ({ trackId }),
  Stopped: undefined,
});

const machine = zen(
  createMachine(
    states,
    {
      Idle: {
        // TypeScript will auto-complete state names
        start: "Playing",
      },
      Playing: {
        // TypeScript will error if the state doesn't exist
        pause: "Paused",
        stop: "Stopped",
      },
      Paused: {
        resume: "Playing",
      },
    },
    "Idle",
  ),
);

machine.st;
//        ^|
