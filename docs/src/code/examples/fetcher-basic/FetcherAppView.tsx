import { useMachine } from "@lib/src/integrations/react";
import { useState } from "react";

interface FetcherAppViewProps {
  machine: any;
}

export function FetcherAppView({ machine }: FetcherAppViewProps) {
  const [url, setUrl] = useState("https://httpbin.org/delay/1");
  useMachine(machine);
  const state = machine.getState();

  const handleFetch = () => {
    machine.execute(url);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 px-2 py-1 border rounded"
            placeholder="Enter URL to fetch"
            disabled={state.is("Pending")}
          />
          <button
            onClick={handleFetch}
            disabled={state.is("Pending")}
            className="px-4 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Fetch
          </button>
        </div>
      </div>

      <div className="p-3 rounded bg-gray-100 dark:bg-gray-800">
        {state.match({
          Idle: () => <span>Ready to fetch data</span>,
          Pending: ({ params }: any) => (
            <span>Fetching from {params[0]}...</span>
          ),
          Resolved: (data: any) => (
            <div className="text-green-600">
              <div>Success!</div>
              <pre className="text-xs mt-2 overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          ),
          Rejected: (error: any) => (
            <span className="text-red-600">Error: {error.message}</span>
          ),
        })}
      </div>
    </div>
  );
}
