import type { Move, RPSMachine } from "./machine";

const getIcon = (move: Move | null | undefined) => {
  switch (move) {
    case "rock":
      return "✊";
    case "paper":
      return "✋";
    case "scissors":
      return "✌️";
    default:
      return "❓";
  }
};

export function RPSAppView({ machine }: { machine: RPSMachine }) {
  const currentState = machine.getState();
  const storeData = machine.store.getState();

  return (
    <div className="max-w-md mx-auto p-6 bg-transparent rounded-lg border border-current/20">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Rock Paper Scissors</h1>
        <div className="flex justify-around text-sm">
          <div>Player: {storeData.playerScore}</div>
          <div>Computer: {storeData.computerScore}</div>
        </div>
      </div>

      {/* Game content based on state */}
      {currentState.match({
        WaitingForPlayer: () => (
          <div className="text-center">
            <h3 className="text-lg mb-3">Choose your move:</h3>
            <div className="flex justify-center gap-4">
              <button
                className="move-btn p-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-4xl"
                onClick={() => machine.selectMove("rock")}
              >
                ✊
              </button>
              <button
                className="move-btn p-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-4xl"
                onClick={() => machine.selectMove("paper")}
              >
                ✋
              </button>
              <button
                className="move-btn p-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-4xl"
                onClick={() => machine.selectMove("scissors")}
              >
                ✌️
              </button>
            </div>
          </div>
        ),
        PlayerChose: () => {
          const storeData = machine.store.getState();
          return (
            <div className="text-center">
              <h3 className="text-lg mb-3">You chose: {getIcon(storeData.playerMove)}</h3>
              <div className="mb-4 text-2xl">VS</div>
              <div className="text-2xl mb-4">🤖</div>
              <button
                onClick={() => machine.computerSelectMove()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Computer Move
              </button>
            </div>
          );
        },
        Judging: () => {
          const storeData = machine.store.getState();
          return (
            <div className="text-center">
              <div className="flex justify-around items-center mb-4">
                <div>
                  <div className="text-4xl mb-2">{getIcon(storeData.playerMove)}</div>
                  <div>You</div>
                </div>
                <div className="text-2xl">VS</div>
                <div>
                  <div className="text-4xl mb-2">{getIcon(storeData.computerMove)}</div>
                  <div>Computer</div>
                </div>
              </div>
              <button
                onClick={() => machine.judge()}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Judge Round
              </button>
            </div>
          );
        },
        RoundComplete: () => {
          const storeData = machine.store.getState();
          return (
            <div className="text-center">
              <h3 className="text-lg mb-3">Round Result:</h3>
              <div className="flex justify-around items-center mb-4">
                <div className="text-center">
                  <div className="text-4xl mb-2">{getIcon(storeData.playerMove)}</div>
                  <div>You</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-2">vs</div>
                  <div className="text-lg mb-2">{storeData.roundWinner || "Tie"}</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-2">{getIcon(storeData.computerMove)}</div>
                  <div>Computer</div>
                </div>
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => machine.nextRound()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Next Round
                </button>
                <button
                  onClick={() => machine.newGame()}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  New Game
                </button>
              </div>
            </div>
          );
        },
        GameOver: () => {
          const storeData = machine.store.getState();
          return (
            <div className="text-center">
              <h3 className="text-xl font-bold mb-3">Game Over!</h3>
              <div className="mb-4">
                <div className="text-lg mb-2">
                  Final Score:
                </div>
                <div className="flex justify-around">
                  <div>
                    <div className="text-4xl mb-2">{storeData.playerScore}</div>
                    <div>You</div>
                  </div>
                  <div>
                    <div className="text-4xl mb-2">{storeData.computerScore}</div>
                    <div>Computer</div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => machine.newGame()}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                New Game
              </button>
            </div>
          );
        },
      })}
    </div>
  );
}
