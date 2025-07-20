import { useMachine } from "matchina/react";
import { MachineActions } from "../lib/MachineActions";
import type { FetcherMachine } from "./machine";

interface FetcherAppViewProps {
  machine: FetcherMachine;
}

export function FetcherAppView({ machine }: FetcherAppViewProps) {
  useMachine(machine);
  const state = machine.getState();
  const { tries } = machine;
  return (
    <div className="space-y-4 p-4 border rounded-lg max-w-full">
      <div className="space-y-2">
        <h3 className="text-lg font-bold">Advanced Fetcher</h3>
        <div className="flex items-center gap-2">
          <span className="font-medium">State:</span>
          <span
            className={state.match({
              Idle: () => "text-gray-500",
              Fetching: () => "text-blue-500",
              ProcessingResponse: () => "text-blue-300",
              Resolved: () => "text-green-500",
              Error: () => "text-red-500",
              NetworkError: () => "text-red-500",
              Aborted: () => "text-yellow-500",
              TimedOut: () => "text-orange-500",
              Refetching: () => "text-purple-500",
            })}
          >
            {state.key}
          </span>
        </div>
        {tries > 0 && (
          <div className="text-sm">
            <span className="font-medium">Attempts:</span> {tries}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Actions:</h4>
        <MachineActions
          transitions={machine.transitions}
          state={state.key}
          send={machine.send}
          children={undefined}
        />
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Response:</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm max-w-full overflow-hidden">
          {state.match({
            Resolved: () => <span className="text-green-600">Success!</span>,
            Error: (error: Error) => (
              <span className="text-red-600">Error: {error?.message}</span>
            ),
            NetworkError: (error: Error) => (
              <span className="text-red-600">
                Network Error: {error?.message}
              </span>
            ),
            _: () => <span className="text-gray-500">n/a</span>,
          })}
        </div>
      </div>
    </div>
  );
}
