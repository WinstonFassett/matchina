import { useState } from "react";

interface PromiseFetcherViewProps {
  machine: any;
  onReset?: () => void;
}

export function PromiseFetcherView({ machine, onReset }: PromiseFetcherViewProps) {
  const [url, setUrl] = useState("https://httpbin.org/delay/1");
  const state = machine.getState();
  const isIdle = state.is("Idle");

  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-muted text-sm min-w-0 focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Enter URL to fetch"
          disabled={!isIdle}
        />
        <button
          onClick={() => machine.execute(url)}
          disabled={!isIdle}
          className="btn btn-primary btn-sm shrink-0"
        >
          Fetch
        </button>
        {!isIdle && (
          <button onClick={() => onReset?.()} className="btn btn-ghost btn-sm shrink-0">
            Reset
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-muted px-4 py-3 min-h-12 flex items-center">
        {state.match({
          Idle: () => <span className="text-sm text-muted-foreground">Ready to fetch</span>,
          Pending: ({ params }: any) => (
            <span className="text-sm text-muted-foreground animate-pulse">
              Fetching {params[0]}…
            </span>
          ),
          Resolved: () => (
            <span className="text-sm font-medium text-[oklch(0.55_0.16_142)]">Success!</span>
          ),
          Rejected: (error: any) => (
            <span className="text-sm font-medium text-destructive">Error: {error.message}</span>
          ),
        })}
      </div>

      <div className="text-center">
        <span className="badge badge-outline text-[10px]">{state.key}</span>
      </div>
    </div>
  );
}
