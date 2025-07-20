import type { Move } from "./states";

export function determineWinner(
  playerMove: Move,
  computerMove: Move,
): "player" | "computer" | "tie" {
  if (playerMove === computerMove) return "tie";
  if (
    (playerMove === "rock" && computerMove === "scissors") ||
    (playerMove === "paper" && computerMove === "rock") ||
    (playerMove === "scissors" && computerMove === "paper")
  ) {
    return "player";
  }
  return "computer";
}
export function randomMove() {
  const moves: Move[] = ["rock", "paper", "scissors"];
  return moves[Math.floor(Math.random() * moves.length)];
}
