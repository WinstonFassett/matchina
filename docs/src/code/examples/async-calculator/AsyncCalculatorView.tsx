import { useState } from "react";
import type { AsyncCalculatorMachine } from "./machine";

interface AsyncCalculatorViewProps {
  machine: AsyncCalculatorMachine;
}

export function AsyncCalculatorView({ machine }: AsyncCalculatorViewProps) {
  const [a, setA] = useState(5);
  const [b, setB] = useState(3);
  const state = machine.getState();
  const isPending = state.is("Pending");

  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="number"
          value={a}
          onChange={(e) => setA(Number(e.target.value))}
          className="w-20 px-3 py-1.5 rounded-lg border border-border bg-muted text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={isPending}
        />
        <span className="text-muted-foreground font-medium">+</span>
        <input
          type="number"
          value={b}
          onChange={(e) => setB(Number(e.target.value))}
          className="w-20 px-3 py-1.5 rounded-lg border border-border bg-muted text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={isPending}
        />
        <button
          onClick={() => machine.execute(a, b)}
          disabled={isPending}
          className="btn btn-primary btn-sm"
        >
          {isPending ? "Calculating…" : "Calculate"}
        </button>
        {!state.is("Idle") && (
          <button onClick={machine.reset} className="btn btn-ghost btn-sm">
            Reset
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-muted px-4 py-3 min-h-12 flex items-center">
        {state.match({
          Idle: () => <span className="text-sm text-muted-foreground">Ready to calculate</span>,
          Pending: ({ params }: any) => (
            <span className="text-sm text-muted-foreground animate-pulse">
              Calculating {params[0]} + {params[1]}…
            </span>
          ),
          Resolved: (result: any) => (
            <span className="text-sm font-semibold">
              Result:{" "}
              <span className="text-[oklch(0.55_0.16_142)]">{result}</span>
            </span>
          ),
          Rejected: (error: any) => (
            <span className="text-sm font-medium text-destructive">
              Error: {error.message}
            </span>
          ),
        })}
      </div>

      <div className="text-center">
        <span className="badge badge-outline text-[10px]">{state.key}</span>
      </div>
    </div>
  );
}
