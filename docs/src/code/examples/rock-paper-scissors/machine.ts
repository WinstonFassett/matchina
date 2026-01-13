import { createMachine, effect, eventApi, setup } from "matchina";
import { randomMove } from "./game-utils";
import { states } from "./states";
import { createStore } from "./store";

export function createRPSMachine() {
  const store = createStore();

  const baseMachine = createMachine(
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

  const machine = Object.assign(baseMachine, { store }, eventApi(baseMachine));

  // bind machine to store
  setup(machine)(
    effect((ev) => {
      ev.match(
        {
          selectMove: store.setPlayerMove,
          computerSelectMove: () => {
            store.setComputerMove(randomMove());
          },
          judge: () => {
            store.judgeRound();
            store.checkGameOver();
            if (store.getState().gameWinner) {
              machine.gameOver();
            }
          },
          nextRound: store.clearRound,
          newGame: store.reset,
        },
        false
      );
    })
  );
  return machine;
}

export type RPSMachine = ReturnType<typeof createRPSMachine>;
