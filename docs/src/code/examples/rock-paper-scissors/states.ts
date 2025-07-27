import { defineStates } from "matchina";

export type Move = "rock" | "paper" | "scissors";

export const states = defineStates({
  WaitingForPlayer: (playerScore: number = 0, computerScore: number = 0) => ({
    playerScore,
    computerScore,
  }),
  PlayerChose: (
    playerMove: Move,
    playerScore: number,
    computerScore: number
  ) => ({
    playerMove,
    playerScore,
    computerScore,
  }),
  Judging: (
    playerMove: Move,
    computerMove: Move,
    playerScore: number,
    computerScore: number
  ) => ({
    playerMove,
    computerMove,
    playerScore,
    computerScore,
  }),
  RoundComplete: (
    playerMove: Move,
    computerMove: Move,
    roundWinner: "player" | "computer" | "tie",
    playerScore: number,
    computerScore: number
  ) => ({
    playerMove,
    computerMove,
    roundWinner,
    playerScore,
    computerScore,
  }),
  GameOver: (
    winner: "player" | "computer",
    playerScore: number,
    computerScore: number
  ) => ({
    winner,
    playerScore,
    computerScore,
  }),
});
