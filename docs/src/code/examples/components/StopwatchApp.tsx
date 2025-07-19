import { getAvailableActions as getStateEvents } from "matchina";
import type { Stopwatch } from "../stopwatch-common/types";

/**
 * A simple Stopwatch UI component that displays the current state, elapsed time,
 * and available actions based on the current state.
 */
export function StopwatchApp({ machine }: { machine: Stopwatch }) {
  const stopwatch = machine;

  // Generate color class based on state
  const stateColorClass = stopwatch.state.match({
    Stopped: () => "text-red-500",
    Ticking: () => "text-green-500",
    Suspended: () => "text-yellow-500",
  });

  return (
    <div className="p-4 rounded border">
      {/* State display */}
      <div className={`inline ${stateColorClass}`}>{stopwatch.state.key}</div>

      {/* Elapsed time */}
      <div className="text-4xl font-bold my-4">
        {(stopwatch.elapsed / 1000).toFixed(1)}s
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {getStateEvents(stopwatch.machine.transitions, stopwatch.state.key)
          .filter((event) => !event.startsWith("_"))
          .map((event) => (
            <button
              className="px-3 py-1 rounded bg-blue-500 text-white text-sm"
              key={event}
              onClick={() => {
                (stopwatch as any)[event]();
              }}
            >
              {event}
            </button>
          ))}
      </div>
    </div>
  );
}
