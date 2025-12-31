import { defineStates } from "matchina";

export type Move = "rock" | "paper" | "scissors";

export const states = defineStates({
  WaitingForPlayer: undefined,
  PlayerChose: undefined,
  Judging: undefined,
  RoundComplete: undefined,
  GameOver: undefined,
});
