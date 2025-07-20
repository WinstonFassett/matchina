import { createMachine, defineStates, zen } from "matchina";

export type Move = "rock" | "paper" | "scissors";

export const states = defineStates({
  WaitingForPlayer: (playerScore: number = 0, computerScore: number = 0) => ({
    playerScore,
    computerScore,
  }),
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
    states,
    {
      WaitingForPlayer: {
        selectMove:
          (move: Move) =>
          ({ from }) => {
            const { playerScore, computerScore } = from.data;
            return states.PlayerChose(move, playerScore, computerScore);
          },
      },
      PlayerChose: {
        computerSelectMove:
          () =>
          ({ from }) => {
            const { playerMove, playerScore, computerScore } = from.data;
            return states.Judging(
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
            return states.RoundComplete(
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
              return states.GameOver(winner, playerScore, computerScore);
            }
            return states.WaitingForPlayer(playerScore, computerScore);
          },
        gameOver: "GameOver",
      },
      GameOver: {
        newGame: "WaitingForPlayer",
      },
    },
    states.WaitingForPlayer(0, 0),
  );
  return Object.assign(zen(machine), {
    randomMove,
  });
}

function randomMove() {
  const moves: Move[] = ["rock", "paper", "scissors"];
  return moves[Math.floor(Math.random() * moves.length)];
}
