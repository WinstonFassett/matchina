// @noErrors
import { defineStates, matchina } from "matchina";

const states = defineStates({
  Idle: undefined,
  Playing: (trackId: string) => ({ trackId }),
  Paused: (trackId: string) => ({ trackId }),
  Stopped: undefined,
});

// ✅ GOOD PRACTICE: Full type inference with inline definitions
const machine = matchina(
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
  "Idle"
);

machine.start("track-123"); // Idle -> Playing
//        ^|

// nice!
