import { getAvailableActions as getStateEvents } from "matchina";
import type { Stopwatch } from "./types";

export function StopwatchView({ stopwatch }: { stopwatch: Stopwatch }) {
  return (
    <div className="p-4 rounded border">
      <div
        className={`inline ${stopwatch.state.match({
          Stopped: () => "text-red-500",
          Ticking: () => "text-green-500",
          Suspended: () => "text-yellow-500",
        })}`}
      >
        {stopwatch.state.key}
      </div>
      <div className="text-4xl">{stopwatch.elapsed / 1000}s</div>
      <div className="flex items-center gap-2">
        {getStateEvents(stopwatch.machine.transitions, stopwatch.state.key).map(
          (event) => {
            return (
              !event.startsWith("_") && (
                <button
                  className="rounded"
                  key={event}
                  onClick={() => {
                    (stopwatch as any)[event]();
                  }}
                >
                  {event}
                </button>
              )
            );
          },
        )}
      </div>
    </div>
  );
}
