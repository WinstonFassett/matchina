import { createStoreMachine, storeApi } from "@lib/src";
import { determineWinner } from "./game-utils";

export type Move = "rock" | "paper" | "scissors";

interface GameState {
  playerMove: Move | null;
  computerMove: Move | null;
  playerScore: number;
  computerScore: number;
  roundWinner: "player" | "computer" | "tie" | null;
  gameWinner: "player" | "computer" | null;
}
const initialState: GameState = {
  playerMove: null,
  computerMove: null,
  playerScore: 0,
  computerScore: 0,
  roundWinner: null,
  gameWinner: null,
};
export function createStore() {
  const baseStore = createStoreMachine<GameState>(initialState, {
    setPlayerMove: (move: Move) => (change) => ({
      ...change.from,
      playerMove: move,
    }),
    setComputerMove: (move: Move) => (change) => ({
      ...change.from,
      computerMove: move,
    }),
    judgeRound: () => (change) => {
      const { playerMove, computerMove, playerScore, computerScore } =
        change.from;
      if (!playerMove || !computerMove) return change.from;
      const winner = determineWinner(playerMove, computerMove);
      return {
        ...change.from,
        roundWinner: winner,
        playerScore: playerScore + (winner === "player" ? 1 : 0),
        computerScore: computerScore + (winner === "computer" ? 1 : 0),
      };
    },
    checkGameOver: () => (change) => {
      const { playerScore, computerScore } = change.from;
      if (playerScore >= 5)
        return { ...change.from, gameWinner: "player" as const };
      if (computerScore >= 5)
        return { ...change.from, gameWinner: "computer" as const };
      return change.from;
    },
    reset: () => () => initialState,
    clearRound: () => (change) => ({
      ...change.from,
      playerMove: null,
      computerMove: null,
      roundWinner: null,
    }),
  });

  return Object.assign(baseStore, storeApi(baseStore));
}
