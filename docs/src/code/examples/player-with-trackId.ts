import { defineStates, createMachine, zen } from "matchina";

// Define states using defineStates
const states = defineStates({
  Idle: () => ({}),
  Playing: (trackId: string) => ({ trackId }),
  Paused: (trackId: string) => ({ trackId }),
  Stopped: () => ({}),
});

// Create the base machine with states, transitions, and initial state
const baseMachine = createMachine(
  states,
  {
    Idle: {
      start: (trackId: string) => (_ev) => states.Playing(trackId),
    },
    Playing: {
      pause: () => (ev) => states.Paused(ev.from.data.trackId),
      stop: () => () => states.Stopped(),
    },
    Paused: {
      resume: () => (ev) => states.Playing(ev.from.data.trackId),
      stop: () => () => states.Stopped(),
    },
    Stopped: {
      start: (trackId: string) => () => states.Playing(trackId),
    },
  },
  "Idle"
);

// Use zen to enhance the machine with utility methods
export const player = zen(baseMachine);

// Usage:
player.start("track-123"); // Idle/Stopped -> Playing
console.log(player.getState().key); // e.g., "Playing"
console.log(player.getState().data); // e.g., { trackId: "track-123" }
const state = player.getState();
console.log(
  "Is playing track 123:",
  state.is("Playing") && state.data.trackId === "track-123"
);
player.pause(); // Playing -> Paused (trackId carried over)
player.resume(); // Paused -> Playing (trackId carried over)
player.stop(); // Playing/Paused -> Stopped
