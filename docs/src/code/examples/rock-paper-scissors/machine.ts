import { createMachine, createStoreMachine, addStoreApi, withSubscribe, setup, effect } from "matchina";
import { states, type Move } from "./states";
import { randomMove, determineWinner } from "./game-utils";

interface GameState {
  playerMove: Move | null;
  computerMove: Move | null;
  playerScore: number;
  computerScore: number;
  roundWinner: "player" | "computer" | "tie" | null;
  gameWinner: "player" | "computer" | null;
}

const createGameStore = (initialState: GameState) => {
  const store = createStoreMachine<GameState>(initialState, {
    setPlayerMove: (move: Move) => (change) => ({ ...change.from, playerMove: move }),
    setComputerMove: (move: Move) => (change) => ({ ...change.from, computerMove: move }),
    judgeRound: () => (change) => {
      const { playerMove, computerMove, playerScore, computerScore } = change.from;
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
      if (playerScore >= 5) return { ...change.from, gameWinner: "player" as const };
      if (computerScore >= 5) return { ...change.from, gameWinner: "computer" as const };
      return change.from;
    },
    reset: () => () => initialState,
    clearRound: () => (change) => ({ ...change.from, playerMove: null, computerMove: null, roundWinner: null }),
  });
  return addStoreApi(withSubscribe(store));
};

export function createRPSMachine() {
  const initialState: GameState = {
    playerMove: null,
    computerMove: null,
    playerScore: 0,
    computerScore: 0,
    roundWinner: null,
    gameWinner: null,
  };

  const store = createGameStore(initialState);

  const machine = createMachine(
    states,
    {
      WaitingForPlayer: {
        selectMove: "PlayerChose",
      },
      PlayerChose: {
        computerSelectMove: "Judging",
      },
      Judging: {
        judge: "RoundComplete",
      },
      RoundComplete: {
        nextRound: "WaitingForPlayer",
        gameOver: "GameOver",
      },
      GameOver: {
        newGame: "WaitingForPlayer",
      },
    },
    "WaitingForPlayer"
  );

  setup(machine)(
    effect((ev) => {
      if (ev.type === "selectMove" && ev.params[0]) {
        store.api.setPlayerMove(ev.params[0] as Move);
      }
      if (ev.type === "computerSelectMove") {
        store.api.setComputerMove(randomMove());
      }
      if (ev.type === "judge") {
        store.api.judgeRound();
        store.api.checkGameOver();
      }
      if (ev.type === "nextRound") {
        store.api.clearRound();
        const { gameWinner } = store.getState();
        if (gameWinner) {
          machine.send("gameOver");
        }
      }
      if (ev.type === "newGame") {
        store.api.reset();
      }
    })
  );

  return Object.assign(machine, { store, randomMove });
}
