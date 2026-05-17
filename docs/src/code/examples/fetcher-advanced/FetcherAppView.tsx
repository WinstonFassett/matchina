import { useMachine } from "matchina/react";
import { MachineActions } from "../lib/MachineActions";
import type { FetcherMachine } from "./machine";

interface FetcherAppViewProps {
  machine: FetcherMachine;
}

const stateColor: Record<string, string> = {
  Idle: "text-muted-foreground",
  Fetching: "text-[oklch(0.60_0.18_240)]",
  ProcessingResponse: "text-[oklch(0.65_0.14_240)]",
  Resolved: "text-[oklch(0.55_0.16_142)]",
  Error: "text-destructive",
  NetworkError: "text-destructive",
  Aborted: "text-[oklch(0.65_0.14_85)]",
  TimedOut: "text-[oklch(0.65_0.15_55)]",
  Refetching: "text-[oklch(0.60_0.18_290)]",
};

export function FetcherAppView({ machine }: FetcherAppViewProps) {
  useMachine(machine);
  const state = machine.getState();
  const { tries } = machine;
  const colorClass = stateColor[state.key] ?? "text-muted-foreground";

  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">State:</span>
        <span className={`text-sm font-semibold ${colorClass}`}>{state.key}</span>
        {tries > 0 && (
          <span className="badge badge-outline text-[10px] ml-auto">
            {tries} {tries === 1 ? "attempt" : "attempts"}
          </span>
        )}
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Actions</p>
        <MachineActions
          transitions={machine.transitions}
          state={state.key}
          send={machine.send}
          children={undefined}
        />
      </div>

      <div className="rounded-xl border border-border bg-muted px-4 py-3 min-h-12 flex items-center">
        {state.match({
          Resolved: () => (
            <span className="text-sm font-medium text-[oklch(0.55_0.16_142)]">Success!</span>
          ),
          Error: (error: Error) => (
            <span className="text-sm font-medium text-destructive">Error: {error?.message}</span>
          ),
          NetworkError: (error: Error) => (
            <span className="text-sm font-medium text-destructive">Network Error: {error?.message}</span>
          ),
          _: () => <span className="text-sm text-muted-foreground">No response yet</span>,
        })}
      </div>
    </div>
  );
}
