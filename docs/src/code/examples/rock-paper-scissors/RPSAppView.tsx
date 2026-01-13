import type { RPSMachine } from "./machine";
import type { Move } from "./store";

// Style lookups
const styles = {
  button: "px-4 py-2 text-white rounded hover:opacity-90 transition-opacity",
  primary: "bg-blue-500 hover:bg-blue-600",
  success: "bg-green-500 hover:bg-green-600",
  danger: "bg-red-500 hover:bg-red-600",
  moveButton:
    "p-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-4xl transition-colors",
  score: "flex justify-around text-sm",
  versus: "flex justify-around items-center mb-4",
  playerCard: "text-center",
  icon: "text-4xl mb-2",
} as const;

const moveIcons: Record<Move, string> = {
  rock: "✊",
  paper: "✋",
  scissors: "✌️",
};

// Convenience components
function MoveButton({ move, onClick }: { move: Move; onClick: () => void }) {
  return (
    <button type="button" className={styles.moveButton} onClick={onClick}>
      {moveIcons[move]}
    </button>
  );
}

function PlayerCard({ move, label }: { move: Move | null; label: string }) {
  return (
    <div className={styles.playerCard}>
      <div className={styles.icon}>{move ? moveIcons[move] : "❓"}</div>
      <div>{label}</div>
    </div>
  );
}

function ScoreDisplay({
  playerScore,
  computerScore,
}: {
  playerScore: number;
  computerScore: number;
}) {
  return (
    <div className={styles.score}>
      <div>Player: {playerScore}</div>
      <div>Computer: {computerScore}</div>
    </div>
  );
}

function VersusDisplay({
  playerMove,
  computerMove,
}: {
  playerMove: Move | null;
  computerMove: Move | null;
}) {
  return (
    <div className={styles.versus}>
      <PlayerCard move={playerMove} label="You" />
      <div className="text-2xl">VS</div>
      <PlayerCard move={computerMove} label="Computer" />
    </div>
  );
}

export function RPSAppView({ machine }: { machine: RPSMachine }) {
  const currentState = machine.getState();
  const storeData = machine.store.getState();

  return (
    <div className="max-w-md mx-auto p-6 bg-transparent rounded-lg border border-current/20">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Rock Paper Scissors</h1>
        <ScoreDisplay
          playerScore={storeData.playerScore}
          computerScore={storeData.computerScore}
        />
      </div>

      {/* Game content based on state */}
      {currentState.match({
        WaitingForPlayer: () => (
          <div className="text-center">
            <h3 className="text-lg mb-3">Choose your move:</h3>
            <div className="flex justify-center gap-4">
              {(["rock", "paper", "scissors"] as Move[]).map((move) => (
                <MoveButton
                  key={move}
                  move={move}
                  onClick={() => machine.selectMove(move)}
                />
              ))}
            </div>
          </div>
        ),
        PlayerChose: () => (
          <div className="text-center">
            <h3 className="text-lg mb-3">
              You chose: {moveIcons[storeData.playerMove!]}
            </h3>
            <div className="mb-4 text-2xl">VS</div>
            <div className="text-2xl mb-4">🤖</div>
            <button
              type="button"
              onClick={() => machine.computerSelectMove()}
              className={`${styles.button} ${styles.primary}`}
            >
              Computer Move
            </button>
          </div>
        ),
        Judging: () => (
          <div className="text-center">
            <VersusDisplay
              playerMove={storeData.playerMove}
              computerMove={storeData.computerMove}
            />
            <button
              type="button"
              onClick={() => machine.judge()}
              className={`${styles.button} ${styles.success}`}
            >
              Judge Round
            </button>
          </div>
        ),
        RoundComplete: () => (
          <div className="text-center">
            <h3 className="text-lg mb-3">Round Result:</h3>
            <div className={styles.versus}>
              <PlayerCard move={storeData.playerMove} label="You" />
              <div className="text-center">
                <div className={styles.icon}>vs</div>
                <div className="text-lg mb-2">
                  {storeData.roundWinner || "Tie"}
                </div>
              </div>
              <PlayerCard move={storeData.computerMove} label="Computer" />
            </div>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => machine.nextRound()}
                className={`${styles.button} ${styles.primary}`}
              >
                Next Round
              </button>
            </div>
          </div>
        ),
        GameOver: () => (
          <div className="text-center">
            <h3 className="text-xl font-bold mb-3">Game Over!</h3>
            <div className="mb-4">
              <div className="text-lg mb-2">Final Score:</div>
              <div className={styles.versus}>
                <div className={styles.playerCard}>
                  <div className={styles.icon}>{storeData.playerScore}</div>
                  <div>You</div>
                </div>
                <div className={styles.playerCard}>
                  <div className={styles.icon}>{storeData.computerScore}</div>
                  <div>Computer</div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => machine.newGame()}
              className={`${styles.button} ${styles.danger}`}
            >
              New Game
            </button>
          </div>
        ),
      })}
    </div>
  );
}
