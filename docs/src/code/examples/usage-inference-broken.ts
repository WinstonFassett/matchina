// @noErrors
import {
  defineStates,
  matchina,
  type FactoryMachineTransitions,
} from "matchina";

const states = defineStates({
  Idle: undefined,
  Playing: (trackId: string) => ({ trackId }),
  Paused: (trackId: string) => ({ trackId }),
  Stopped: undefined,
});
// ---cut---
// ❌ BAD PRACTICE: Standalone transitions have no types
const invalidTransitions = {
  Idle: {
    start: "Playing",
  },
  Playing: {
    pause: "Paused",
    stop: "Stopped",
  },
  Paused: {
    resume: "Playing",
  },
};

const invalidMachine = matchina(
  states,
  invalidTransitions as any, // invalid because not typed correctly
  "Idle"
);

invalidMachine; // never

// Workaround: use `satisfies` to type transitions
const transitionsWithSatisfies = {
  Idle: {
    start: "Playing",
  },
  Playing: {
    pause: "Paused",
    stop: "Stopped",
    replay: () => (ev) => states.Playing(ev.from.data.trackId),
  },
  Paused: {
    resume: "Playing",
  },
} satisfies FactoryMachineTransitions<typeof states>;

const validMachine = matchina(states, transitionsWithSatisfies, "Idle");

validMachine.start("track-123"); // Idle -> Playing
//             ^|

// correctly typed
