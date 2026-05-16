import { getAvailableActions } from "matchina";
import { useMachine } from "matchina/react";
import type { Stopwatch } from "./types";

export function StopwatchView({ machine }: { machine: Stopwatch }) {
  useMachine(machine);
  const state = machine.getState();
  const isTicking = state.is("Ticking");
  const isStopped = state.is("Stopped");

  const dot = isTicking  ? "bg-green-600 dark:bg-green-400"
            : isStopped  ? "bg-destructive"
            :               "bg-amber-500 dark:bg-amber-400";

  const btnVariant = (event: string) =>
    event === "start" || event === "resume" ? "btn-primary"  :
    event === "suspend"                     ? "btn-outline"  :
    /* stop, clear */                         "btn-ghost";

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <span className="badge badge-outline gap-1.5">
        <span className={`size-1.5 rounded-full ${dot} ${isTicking ? "animate-pulse" : ""}`} />
        {state.key}
      </span>

      <div className="flex flex-col items-center gap-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">elapsed</span>
        <span className="text-6xl font-semibold tabular-nums text-foreground">
          {(machine.elapsed / 1000).toFixed(1)}
          <span className="text-2xl font-normal text-muted-foreground ml-0.5">s</span>
        </span>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {getAvailableActions(machine.transitions, state.key)
          .filter(e => !e.startsWith("_"))
          .map(event => (
            <button
              key={event}
              className={`btn ${btnVariant(event)} ${event === "clear" ? "btn-sm" : ""}`}
              onClick={() => (machine as any)[event]()}
            >
              {event}
            </button>
          ))}
      </div>
    </div>
  );
}
