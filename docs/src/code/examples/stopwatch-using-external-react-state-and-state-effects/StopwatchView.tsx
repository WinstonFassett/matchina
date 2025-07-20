import { getAvailableActions as getStateEvents } from "matchina";
import type { Stopwatch } from "../stopwatch-common/types";
import { useMachine } from "@lib/src/integrations/react";

/**
 * A simple Stopwatch UI component that displays the current state, elapsed time,
 * and available actions based on the current state.
 */
export function StopwatchView({ machine }: { machine: Stopwatch }) {
  useMachine(machine);
  // console.log("StopwatchView", machine);
  const state = machine.getState();
  // Generate color class based on state
  const stateColorClass = state.match({
    Stopped: () => "text-red-500",
    Ticking: () => "text-green-500",
    Suspended: () => "text-yellow-500",
  });

  return (
    <div className="p-4 rounded border">
      {/* State display */}
      <div className={`inline ${stateColorClass}`}>{state.key}</div>

      {/* Elapsed time */}
      <div className="text-4xl font-bold my-4">
        {(machine.elapsed / 1000).toFixed(1)}s
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {getStateEvents(machine.transitions, state.key)
          .filter((event) => !event.startsWith("_"))
          .map((event) => (
            <button
              className="px-3 py-1 rounded bg-blue-500 text-white text-sm"
              key={event}
              onClick={() => {
                (machine as any)[event]();
              }}
            >
              {event}
            </button>
          ))}
      </div>
    </div>
  );
}
