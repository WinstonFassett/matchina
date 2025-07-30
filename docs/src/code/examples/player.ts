import { defineStates, createMachine, assignEventApi } from "matchina";

// Define states using defineStates
const states = defineStates({
  Idle: undefined,
  Playing: undefined,
  Paused: undefined,
  Stopped: undefined,
});

// Create the base machine with states, transitions, and initial state
const baseMachine = createMachine(
  states,
  {
    Idle: { start: "Playing" },
    Playing: {
      pause: "Paused",
      stop: "Stopped",
    },
    Paused: {
      resume: "Playing",
      stop: "Stopped",
    },
    Stopped: { start: "Playing" },
  },
  "Idle"
);

//Use assignEventApi to enhance the machine with utility methods
export const player = assignEventApi(baseMachine);

// Usage:
player.start(); // Idle/Stopped -> Playing
player.pause(); // Playing -> Paused
player.resume(); // Paused -> Playing
player.stop(); // Playing/Paused -> Stopped

console.log(player.getState().is("Playing")); // false;
