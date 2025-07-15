import { facade } from "matchina";

// Playback controls state machine example
export const player = facade(
  {
    Idle: () => ({}),
    Playing: (trackId: string) => ({ trackId }),
    Paused: (trackId: string) => ({ trackId }),
    Stopped: () => ({}),
  },
  {
    Idle: {
      start: (trackId: string) => (player) =>
        player.machine.states.Playing(trackId),
    },
    Playing: {
      pause: () => (player) =>
        player.machine.states.Paused(player.from.state.data.trackId),
      stop: () => (player) => player.machine.states.Stopped(),
    },
    Paused: {
      resume: () => (player) =>
        player.machine.states.Playing(player.from.state.data.trackId),
      stop: () => (player) => player.machine.states.Stopped(),
    },
    Stopped: {
      start: (trackId: string) => (player) =>
        player.machine.states.Playing(trackId),
    },
  },
  "Idle",
);

// Usage:
player.start("track-123"); // Idle/Stopped -> Playing
console.log(player.state.key); // e.g., "Playing"
console.log(player.state.data); // e.g., { trackId: "track-123" }
console.log("Is playing track 123:", 
  player.state.is("Playing") && 
  player.state.data.trackId === "track-123"
);
player.pause(); // Playing -> Paused (trackId carried over)
player.resume(); // Paused -> Playing (trackId carried over)
player.stop(); // Playing/Paused -> Stopped
