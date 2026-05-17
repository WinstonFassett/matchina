import type { RPSMachine } from "./machine";
import type { Move } from "./store";

const moveIcons: Record<Move, string> = {
  rock: "✊",
  paper: "🖐️",
  scissors: "✌️",
};

const moveAccent: Record<Move, string> = {
  rock: "hover:bg-[oklch(0.70_0.14_38)] hover:border-[oklch(0.60_0.16_38)] hover:text-white",
  paper: "hover:bg-[oklch(0.70_0.12_240)] hover:border-[oklch(0.60_0.14_240)] hover:text-white",
  scissors: "hover:bg-[oklch(0.68_0.15_12)] hover:border-[oklch(0.58_0.17_12)] hover:text-white",
};

function MoveButton({ move, onClick }: { move: Move; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 px-5 py-4 rounded-2xl border border-border bg-card transition-all duration-150 cursor-pointer select-none active:scale-95 ${moveAccent[move]}`}
    >
      <span className="text-5xl leading-none">{moveIcons[move]}</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest opacity-50 capitalize">{move}</span>
    </button>
  );
}

function PlayerCard({ move, label }: { move: Move | null; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-5xl leading-none">{move ? moveIcons[move] : "❓"}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function ScorePip({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-2xl font-bold tabular-nums">{score}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function RPSAppView({ machine }: { machine: RPSMachine }) {
  const currentState = machine.getState();
  const storeData = machine.store.getState();

  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold tracking-tight">Rock · Paper · Scissors</h1>
        <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-muted">
          <ScorePip label="You" score={storeData.playerScore} />
          <span className="text-muted-foreground text-xs">vs</span>
          <ScorePip label="CPU" score={storeData.computerScore} />
        </div>
      </div>

      {currentState.match({
        WaitingForPlayer: () => (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">Choose your move</p>
            <div className="flex justify-center gap-3">
              {(["rock", "paper", "scissors"] as Move[]).map((move) => (
                <MoveButton key={move} move={move} onClick={() => machine.selectMove(move)} />
              ))}
            </div>
          </div>
        ),

        PlayerChose: () => (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-around w-full px-4">
              <PlayerCard move={storeData.playerMove} label="You" />
              <span className="text-muted-foreground text-sm font-medium">vs</span>
              <div className="flex flex-col items-center gap-1">
                <span className="text-5xl leading-none">🤖</span>
                <span className="text-xs text-muted-foreground">CPU</span>
              </div>
            </div>
            <button type="button" onClick={() => machine.computerSelectMove()} className="btn btn-primary btn-sm">
              CPU picks...
            </button>
          </div>
        ),

        Judging: () => (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-around w-full px-4">
              <PlayerCard move={storeData.playerMove} label="You" />
              <span className="text-muted-foreground text-sm font-medium">vs</span>
              <PlayerCard move={storeData.computerMove} label="CPU" />
            </div>
            <button type="button" onClick={() => machine.judge()} className="btn btn-secondary btn-sm">
              Judge Round
            </button>
          </div>
        ),

        RoundComplete: () => {
          const winner = storeData.roundWinner;
          const resultLabel = !winner ? "Tie!" : winner === "player" ? "You win!" : "CPU wins!";
          const resultColor = !winner
            ? "text-muted-foreground"
            : winner === "player"
            ? "text-[oklch(0.55_0.16_142)]"
            : "text-destructive";
          return (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-around w-full px-4">
                <PlayerCard move={storeData.playerMove} label="You" />
                <div className="flex flex-col items-center gap-1">
                  <span className={`text-lg font-bold ${resultColor}`}>{resultLabel}</span>
                </div>
                <PlayerCard move={storeData.computerMove} label="CPU" />
              </div>
              <button type="button" onClick={() => machine.nextRound()} className="btn btn-primary btn-sm">
                Next Round
              </button>
            </div>
          );
        },

        GameOver: () => {
          const playerWon = storeData.playerScore > storeData.computerScore;
          return (
            <div className="flex flex-col items-center gap-4">
              <div className="text-center">
                <p className="text-2xl mb-1">{playerWon ? "🏆" : "💀"}</p>
                <h3 className="text-base font-semibold">{playerWon ? "You win!" : "CPU wins!"}</h3>
                <p className="text-sm text-muted-foreground">
                  Final: {storeData.playerScore} – {storeData.computerScore}
                </p>
              </div>
              <button type="button" onClick={() => machine.newGame()} className="btn btn-outline btn-sm">
                Play Again
              </button>
            </div>
          );
        },
      })}

      <div className="text-center">
        <span className="badge badge-outline text-[10px]">{currentState.key}</span>
      </div>
    </div>
  );
}
