// @noErrors
import {
  defineStates,
  createMachine,
  zen,
  type FactoryMachineTransitions,
  matchina,
} from "matchina";

const states = defineStates({
  Idle: undefined,
  Playing: (trackId: string) => ({ trackId }),
  Paused: (trackId: string) => ({ trackId }),
  Stopped: undefined,
});

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
  invalidTransitions, // invalid because not typed correctly
  "Idle",
);

invalidMachine; // never

// Workaround: use `as const` to type transitions
// But you will not get type safety within them
const transitionsAsConst = {
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
} as const;

const validMachine = matchina(states, transitionsAsConst, "Idle");

validMachine.st;
//             ^|
