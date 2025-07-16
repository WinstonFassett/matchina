import { createApi } from "matchina";
import { useMemo } from "react";
import { MachineActions } from "../../../components/MachineActions";

interface FetcherAppViewProps {
  machine: any; // We'd ideally type this properly with the fetcher type
}

export function FetcherAppView({ machine }: FetcherAppViewProps) {
  const fetcher = machine;
  const { tries } = fetcher;
  
  const actions = useMemo(
    () => createApi(fetcher.machine, fetcher.state.key),
    [fetcher.state]
  );

  return (
    <div className="p-4 border rounded">
      <div className="mb-4">
        <h3 className="text-lg font-bold">Advanced Fetcher</h3>
        <div className="flex items-center gap-2">
          <span className="font-medium">State:</span> 
          <span className={fetcher.state.match({
            Idle: () => "text-gray-500",
            Fetching: () => "text-blue-500",
            ProcessingResponse: () => "text-blue-300",
            Resolved: () => "text-green-500",
            Error: () => "text-red-500",
            NetworkError: () => "text-red-500",
            Aborted: () => "text-yellow-500",
            TimedOut: () => "text-orange-500",
            Refetching: () => "text-purple-500",
          })}>
            {fetcher.state.key}
          </span>
        </div>
        {tries > 0 && (
          <div className="text-sm mt-1">
            <span className="font-medium">Attempts:</span> {tries}
          </div>
        )}
      </div>

      <div className="mb-4">
        <MachineActions
          transitions={fetcher.machine.transitions}
          state={fetcher.state.key}
          send={fetcher.machine.send}
          children={undefined}
        />
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium mb-1">Response Data:</h4>
        <div className="bg-gray-100 p-2 rounded text-sm max-h-40 overflow-auto">
          <pre>
            {fetcher.state.match({
              Resolved: (data: any) => JSON.stringify(data, null, 2),
              Error: (error: Error) => `Error: ${error.message}`,
              NetworkError: (error: Error) => `Network Error: ${error.message}`,
              _: () => "No data available"
            })}
          </pre>
        </div>
      </div>
    </div>
  );
}
