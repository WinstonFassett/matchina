import { matchina } from "../src/matchina";

export const player = matchina(
  // Define states as keys to optional values or creator functions
  {
    Idle: undefined,
    Playing: undefined,
    Paused: undefined,
    Stopped: undefined,
  },
  // Define transitions, typed by states and their parameters and values
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

// Usage:
player.start();      // Idle/Stopped -> Playing
player.pause();      // Playing -> Paused
player.resume();     // Paused -> Playing
player.stop();       // Playing/Paused -> Stopped

console.log(player.state.is("Playing"));  // false;
