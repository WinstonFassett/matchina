import { useEffect } from "react";
import { useMachine } from "matchina/react";
import type { RPSMachine } from "./machine";
import type { Move } from "./store";

const moveIcons: Record<Move, string> = {
  rock: "✊",
  paper: "🖐️",
  scissors: "✌️",
};

const moveLabel: Record<Move, string> = {
  rock: "Rock",
  paper: "Paper",
  scissors: "Scissors",
};

const moveAccentBg: Record<Move, string> = {
  rock: "hover:bg-[oklch(0.24_0.08_38)] hover:border-[oklch(0.40_0.12_38)]",
  paper: "hover:bg-[oklch(0.22_0.06_240)] hover:border-[oklch(0.38_0.10_240)]",
  scissors: "hover:bg-[oklch(0.24_0.08_12)] hover:border-[oklch(0.40_0.12_12)]",
};

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-current opacity-50 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
        />
      ))}
    </span>
  );
}

function MoveButton({ move, onClick }: { move: Move; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 flex-1 py-4 rounded-xl border border-[oklch(0.28_0.02_240)] bg-[oklch(0.16_0.01_240)] transition-all duration-150 cursor-pointer select-none active:scale-95 group ${moveAccentBg[move]}`}
    >
      <span className="text-5xl leading-none">{moveIcons[move]}</span>
      <span className="text-[8px] font-mono uppercase tracking-widest text-[oklch(0.50_0.02_240)] group-hover:text-[oklch(0.72_0.02_240)] transition-colors">
        {moveLabel[move]}
      </span>
    </button>
  );
}

function MoveDisplay({ move, label, dim }: { move: Move | null; label: string; dim?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 w-20">
      <span className={`text-5xl leading-none transition-all duration-300 ${dim ? "opacity-25 scale-90" : ""}`}>
        {move ? moveIcons[move] : "❓"}
      </span>
      <span className="text-[8px] font-mono uppercase tracking-widest text-[oklch(0.42_0.02_240)]">{label}</span>
    </div>
  );
}

export function RPSAppView({ machine }: { machine: RPSMachine }) {
  useMachine(machine);
  useMachine(machine.store);
  const currentState = machine.getState();
  const storeData = machine.store.getState();

  useEffect(() => {
    if (!currentState.is("PlayerChose")) return;
    const t = setTimeout(() => machine.computerSelectMove(), 600);
    return () => clearTimeout(t);
  }, [currentState.key]);

  useEffect(() => {
    if (!currentState.is("Judging")) return;
    const t = setTimeout(() => machine.judge(), 500);
    return () => clearTimeout(t);
  }, [currentState.key]);

  return (
    <div className="max-w-xs mx-auto flex flex-col gap-3 py-3">
      {/* Unified game card */}
      <div className="bg-[oklch(0.13_0.01_240)] rounded-2xl border border-[oklch(0.22_0.01_240)] overflow-hidden">

        {/* Scoreboard — inset header */}
        <div className="flex items-center border-b border-[oklch(0.20_0.01_240)]">
          <div className="flex flex-col items-center gap-0.5 flex-1 py-4">
            <span className="text-[8px] font-mono uppercase tracking-widest text-[oklch(0.42_0.02_240)]">You</span>
            <span className="text-3xl font-black tabular-nums text-[oklch(0.88_0.01_240)]">{storeData.playerScore}</span>
          </div>
          <div className="w-px h-10 bg-[oklch(0.24_0.01_240)]" />
          <div className="flex flex-col items-center gap-0.5 flex-1 py-4">
            <span className="text-[8px] font-mono uppercase tracking-widest text-[oklch(0.42_0.02_240)]">CPU</span>
            <span className="text-3xl font-black tabular-nums text-[oklch(0.88_0.01_240)]">{storeData.computerScore}</span>
          </div>
        </div>

        {/* Arena — fixed height so card doesn't jump */}
        <div className="flex flex-col items-center justify-center min-h-[220px] px-4 py-5">
          {currentState.match({
            WaitingForPlayer: () => (
              <div className="flex flex-col items-center gap-4 w-full">
                <span className="text-[8px] font-mono uppercase tracking-widest text-[oklch(0.42_0.02_240)]">
                  Choose your move
                </span>
                <div className="flex gap-2 w-full">
                  {(["rock", "paper", "scissors"] as Move[]).map((move) => (
                    <MoveButton key={move} move={move} onClick={() => machine.selectMove(move)} />
                  ))}
                </div>
              </div>
            ),

            PlayerChose: () => (
              <div className="flex flex-col items-center gap-4 w-full">
                <span className="text-[8px] font-mono uppercase tracking-widest text-[oklch(0.42_0.02_240)] flex items-center gap-1.5">
                  CPU thinking <ThinkingDots />
                </span>
                <div className="flex items-center justify-around w-full px-4">
                  <MoveDisplay move={storeData.playerMove} label="You" />
                  <span className="text-xs font-mono text-[oklch(0.30_0.01_240)]">vs</span>
                  <div className="flex flex-col items-center gap-1.5 w-20">
                    <span className="text-5xl leading-none animate-pulse">🤔</span>
                    <span className="text-[8px] font-mono uppercase tracking-widest text-[oklch(0.42_0.02_240)]">CPU</span>
                  </div>
                </div>
              </div>
            ),

            Judging: () => (
              <div className="flex flex-col items-center gap-4 w-full">
                <span className="text-[8px] font-mono uppercase tracking-widest text-[oklch(0.42_0.02_240)] flex items-center gap-1.5">
                  Judging <ThinkingDots />
                </span>
                <div className="flex items-center justify-around w-full px-4">
                  <MoveDisplay move={storeData.playerMove} label="You" />
                  <span className="text-sm font-black text-[oklch(0.30_0.01_240)]">VS</span>
                  <MoveDisplay move={storeData.computerMove} label="CPU" />
                </div>
              </div>
            ),

            RoundComplete: () => {
              const winner = storeData.roundWinner;
              const resultLabel = !winner ? "Tie" : winner === "player" ? "You win" : "CPU wins";
              const resultColor = !winner
                ? "text-[oklch(0.52_0.02_240)]"
                : winner === "player"
                  ? "text-[oklch(0.72_0.18_142)]"
                  : "text-[oklch(0.65_0.18_15)]";
              return (
                <div className="flex flex-col items-center gap-4 w-full">
                  <span className={`text-2xl font-black tracking-tight ${resultColor}`}>{resultLabel}</span>
                  <div className="flex items-center justify-around w-full px-4">
                    <MoveDisplay move={storeData.playerMove} label="You" dim={!!(winner && winner !== "player")} />
                    <span className="text-sm font-black text-[oklch(0.26_0.01_240)]">VS</span>
                    <MoveDisplay move={storeData.computerMove} label="CPU" dim={!!(winner && winner !== "computer")} />
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
                  <span className="text-5xl leading-none">{playerWon ? "🏆" : "💀"}</span>
                  <div className="text-center">
                    <p className="text-lg font-black text-[oklch(0.88_0.01_240)]">
                      {playerWon ? "You win" : "CPU wins"}
                    </p>
                    <p className="text-xs text-[oklch(0.42_0.02_240)] mt-0.5 font-mono tabular-nums">
                      {storeData.playerScore} — {storeData.computerScore}
                    </p>
                  </div>
                  <button type="button" onClick={() => machine.newGame()} className="btn btn-outline btn-sm">
                    Play Again
                  </button>
                </div>
              );
            },
          })}
        </div>
      </div>

      {/* State badge */}
      <div className="text-center">
        <span className="badge badge-outline text-[10px]">{currentState.key}</span>
      </div>
    </div>
  );
}
