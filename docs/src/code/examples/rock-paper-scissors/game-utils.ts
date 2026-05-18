import type { Move } from "./store";

const rules: Record<Move, { beats: Move }> = {
  rock: { beats: "scissors" },
  paper: { beats: "rock" },
  scissors: { beats: "paper" },
};

export function determineWinner(
  playerMove: Move,
  computerMove: Move
): "player" | "computer" | "tie" {
  if (playerMove === computerMove) return "tie";
  if (rules[playerMove].beats === computerMove) {
    return "player";
  }
  return "computer";
}

export function randomMove(): Move {
  const moves: Move[] = ["rock", "paper", "scissors"];
  return moves[Math.floor(Math.random() * moves.length)];
}
