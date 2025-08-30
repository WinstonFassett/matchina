import { useMachine } from "matchina/react";

import type { createUploaderMachine } from "./machine";

type Machine = ReturnType<typeof createUploaderMachine>;

export function FileUploaderView({ machine }: { machine: Machine }) {
  useMachine(machine);
  const state = machine.getState() as any;
  const files: Record<string, { key: string; pct?: number }> = (state?.files ?? {});
  const online = state.key === "Online";

  return (
    <div className="p-4 space-y-3 border rounded">
      <h3 className="font-semibold">File Uploader</h3>
      <div className="text-sm">
        Status: <span className={`px-2 py-1 rounded font-semibold text-sm ${
          online 
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        }`}>
          {online ? "Online" : "Offline"}
        </span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => machine.api.enqueue()} className="px-3 py-2 rounded bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors">Add File</button>
        <button onClick={() => machine.api.wentOffline()} className="px-3 py-2 rounded bg-orange-500 text-white text-sm hover:bg-orange-600 transition-colors">Go Offline</button>
        <button onClick={() => machine.api.cameOnline()} className="px-3 py-2 rounded bg-green-500 text-white text-sm hover:bg-green-600 transition-colors">Go Online</button>
      </div>
      <ul className="space-y-2">
        {Object.entries(files).map(([id, f]) => (
          <li key={id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded font-mono">{id}</code>
              <span className="ml-auto">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${{
                  Completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                  Uploading: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                  Failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                }[f.key] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}>
                  {f.key}{f.key === "Uploading" ? ` (${f.pct ?? 0}%)` : ""}
                </span>
              </span>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              <button onClick={() => machine.api.startUpload(id)} className="px-2 py-1 rounded bg-blue-500 text-white text-xs hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed" disabled={!online}>Start</button>
              <button onClick={() => machine.api.progress(id, Math.min(100, (f.pct ?? 0) + 20))} className="px-2 py-1 rounded bg-purple-500 text-white text-xs hover:bg-purple-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed" disabled={!online}>+20%</button>
              <button onClick={() => machine.api.uploadOk(id)} className="px-2 py-1 rounded bg-green-500 text-white text-xs hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed" disabled={!online}>Upload OK</button>
              <button onClick={() => machine.api.verified(id)} className="px-2 py-1 rounded bg-teal-500 text-white text-xs hover:bg-teal-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed" disabled={!online}>Verify OK</button>
              <button onClick={() => machine.api.uploadErr(id)} className="px-2 py-1 rounded bg-red-500 text-white text-xs hover:bg-red-600 transition-colors">Fail</button>
              <button onClick={() => machine.api.retry(id)} className="px-2 py-1 rounded bg-yellow-500 text-white text-xs hover:bg-yellow-600 transition-colors">Retry</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
