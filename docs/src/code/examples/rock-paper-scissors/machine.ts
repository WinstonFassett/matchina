import { createMachine, zen } from "matchina";
import { states, type Move } from "./states";
import { randomMove, determineWinner } from "./game-utils";

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
              computerScore
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
              computerScore + (winner === "computer" ? 1 : 0)
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
    states.WaitingForPlayer(0, 0)
  );
  return Object.assign(zen(machine), {
    randomMove,
  });
}
