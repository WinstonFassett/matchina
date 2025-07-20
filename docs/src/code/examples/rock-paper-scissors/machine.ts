// @errors: 2307
import { createMachine, defineStates, zen } from "matchina";

// Define the possible moves
export type Move = "rock" | "paper" | "scissors";

// Define our game states
export const gameStates = defineStates({
  // Waiting for player to choose
  WaitingForPlayer: (playerScore: number = 0, computerScore: number = 0) => ({
    playerScore,
    computerScore,
  }),

  // Player has chosen, now computer chooses
  PlayerChose: (
    playerMove: Move,
    playerScore: number,
    computerScore: number,
  ) => ({
    playerMove,
    playerScore,
    computerScore,
  }),
  Judging: (
    playerMove: Move,
    computerMove: Move,
    playerScore: number,
    computerScore: number,
  ) => ({
    playerMove,
    computerMove,
    playerScore,
    computerScore,
  }),

  // Round complete, showing results
  RoundComplete: (
    playerMove: Move,
    computerMove: Move,
    roundWinner: "player" | "computer" | "tie",
    playerScore: number,
    computerScore: number,
  ) => ({
    playerMove,
    computerMove,
    roundWinner,
    playerScore,
    computerScore,
  }),

  // Game over (someone reached win threshold)
  GameOver: (
    winner: "player" | "computer",
    playerScore: number,
    computerScore: number,
  ) => ({
    winner,
    playerScore,
    computerScore,
  }),
});

// Helper to determine winner of a round
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

export function createRPSMachine() {
  const machine = createMachine(
    gameStates,
    {
      WaitingForPlayer: {
        selectMove:
          (move: Move) =>
          ({ from }) => {
            const { playerScore, computerScore } = from.data;
            return gameStates.PlayerChose(move, playerScore, computerScore);
          },
      },
      PlayerChose: {
        computerSelectMove:
          () =>
          ({ from }) => {
            const { playerMove, playerScore, computerScore } = from.data;
            return gameStates.Judging(
              playerMove,
              randomMove(),
              playerScore,
              computerScore,
            );
          },
      },
      Judging: {
        judge:
          () =>
          ({ from }) => {
            const { playerMove, computerMove, playerScore, computerScore } =
              from.data;
            const winner = determineWinner(playerMove, computerMove);
            return gameStates.RoundComplete(
              playerMove,
              computerMove,
              winner,
              playerScore + (winner === "player" ? 1 : 0),
              computerScore + (winner === "computer" ? 1 : 0),
            );
          },
      },
      RoundComplete: {
        nextRound:
          () =>
          ({ from }) => {
            const { playerScore, computerScore } = from.data;
            // Check if game over condition is met (e.g., score >= 5)
            if (playerScore >= 5 || computerScore >= 5) {
              const winner = playerScore >= 5 ? "player" : "computer";
              return gameStates.GameOver(winner, playerScore, computerScore);
            }
            return gameStates.WaitingForPlayer(playerScore, computerScore);
          },
      },
      GameOver: {
        newGame: "WaitingForPlayer",
      },
    },
    gameStates.WaitingForPlayer(0, 0),
  );

  const game = Object.assign(zen(machine), {
    randomMove,
  });

  return game;
}

function randomMove() {
  const moves: Move[] = ["rock", "paper", "scissors"];
  return moves[Math.floor(Math.random() * moves.length)];
}
