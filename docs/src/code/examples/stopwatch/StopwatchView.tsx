import { getAvailableActions as getStateEvents } from "matchina";
import { useMachine } from "matchina/react";
import type { createStopwatchMachine } from "./machine";

type StopwatchMachine = ReturnType<typeof createStopwatchMachine>;

export function StopwatchView({ machine }: { machine: StopwatchMachine }) {
  useMachine(machine);
  useMachine(machine.store);
  const state = machine.getState();
  const elapsed = machine.store.getState().elapsed;

  const stateColorClass = state.match({
    Stopped: () => "text-red-500",
    Ticking: () => "text-green-500",
    Suspended: () => "text-yellow-500",
  });

  return (
    <div className="p-4 rounded border">
      <div className={`inline ${stateColorClass}`}>{state.key}</div>

      <div className="text-4xl font-bold my-4">
        {(elapsed / 1000).toFixed(1)}s
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {getStateEvents(machine.transitions, state.key)
          .filter((event) => !event.startsWith("_"))
          .map((event) => (
            <button
              className="px-3 py-1 rounded bg-blue-500 text-white text-sm"
              key={event}
              onClick={() => machine.send(event)}
            >
              {event}
            </button>
          ))}
      </div>
    </div>
  );
}
