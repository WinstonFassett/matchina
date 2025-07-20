import { useState } from "react";

interface FetcherAppViewProps {
  machine: any;
  onReset?: () => void;
}

export function FetcherAppView({ machine, onReset }: FetcherAppViewProps) {
  const [url, setUrl] = useState("https://httpbin.org/delay/1");
  const state = machine.getState();
  const isIdle = state.is("Idle");

  const handleFetch = () => {
    machine.execute(url);
  };

  const handleReset = () => {
    onReset?.();
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg max-w-full">
      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 px-2 py-1 border rounded min-w-0"
            placeholder="Enter URL to fetch"
            disabled={!isIdle}
          />
          <button
            onClick={handleFetch}
            disabled={!isIdle}
            className="px-4 py-1 bg-blue-500 text-white rounded disabled:opacity-50 whitespace-nowrap"
          >
            Fetch
          </button>
          {!isIdle && (
            <button
              onClick={handleReset}
              className="px-4 py-1 bg-gray-500 text-white rounded whitespace-nowrap"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="p-3 rounded bg-gray-100 dark:bg-gray-800 max-w-full overflow-hidden">
        {state.match({
          Idle: () => <span>Ready to fetch data</span>,
          Pending: ({ params }: any) => (
            <span>Fetching from {params[0]}...</span>
          ),
          Resolved: (data: any) => (
            <div className="text-green-600">
              <div>Success!</div>
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
