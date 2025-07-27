import { defineStates, createMachine, zen } from "matchina";

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

// Use zen to enhance the machine with utility methods
export const player = zen(baseMachine);

// Usage:
player.start(); // Idle/Stopped -> Playing
player.pause(); // Playing -> Paused
player.resume(); // Paused -> Playing
player.stop(); // Playing/Paused -> Stopped

console.log(player.getState().is("Playing")); // false;
