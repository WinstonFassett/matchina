import { defineStates } from "matchina";

import type { Move } from "./store";

export const states = defineStates({
  WaitingForPlayer: undefined,
  PlayerChose: (move: Move) => ({ move }),
  Judging: undefined,
  RoundComplete: undefined,
  GameOver: undefined,
});
