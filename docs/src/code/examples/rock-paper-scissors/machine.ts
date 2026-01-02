import { createMachine, createStoreMachine, setup, effect } from "matchina";
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

export function createRPSMachine() {
  const initialState: GameState = {
    playerMove: null,
    computerMove: null,
    playerScore: 0,
    computerScore: 0,
    roundWinner: null,
    gameWinner: null,
  };

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
        store.dispatch("setPlayerMove", ev.params[0] as Move);
      }
      if (ev.type === "computerSelectMove") {
        store.dispatch("setComputerMove", randomMove());
      }
      if (ev.type === "judge") {
        const playerMove = store.getState().playerMove;
        const computerMove = store.getState().computerMove;
        if (playerMove && computerMove) {
          const result = determineWinner(playerMove, computerMove);
          store.dispatch("setResult", result);
          if (result === "player") {
            store.dispatch("incrementPlayerScore");
          } else if (result === "computer") {
            store.dispatch("incrementComputerScore");
          }
        }
        machine.send("judge");
      }
      if (ev.type === "nextRound") {
        store.dispatch("clearMoves");
        machine.send("nextRound");
      }
      if (ev.type === "newGame") {
        store.dispatch("reset");
        machine.send("newGame");
      }
    })
  );

  const enhancedMachine = Object.assign(machine, {
    store,
    selectMove: (move: Move) => {
      store.dispatch("setPlayerMove", move);
      machine.send("selectMove");
    },
    computerSelectMove: () => {
      store.dispatch("setComputerMove", randomMove());
      machine.send("computerSelectMove");
    },
    judge: () => {
      const playerMove = store.getState().playerMove;
      const computerMove = store.getState().computerMove;
      if (playerMove && computerMove) {
        const result = determineWinner(playerMove, computerMove);
        store.dispatch("setResult", result);
        if (result === "player") {
          store.dispatch("incrementPlayerScore");
        } else if (result === "computer") {
          store.dispatch("incrementComputerScore");
        }
      }
      machine.send("judge");
    },
    nextRound: () => {
      store.dispatch("clearMoves");
      machine.send("nextRound");
    },
    newGame: () => {
      store.dispatch("reset");
      machine.send("newGame");
    }
  });

  return enhancedMachine;
}

export type RPSMachine = ReturnType<typeof createRPSMachine>;
export type { Move };
