import React from "react";

import type { createUploaderMachine } from "./machine";

type Machine = ReturnType<typeof createUploaderMachine>;

export function FileUploaderView({ machine }: { machine: Machine }) {
  const state = machine.getState() as any;
  const files = state.files as Record<string, { key: string; pct?: number }>;
  const online = state.key === "Online";

  return (
    <div className="p-4 space-y-3 border rounded">
      <h3 className="font-semibold">File Uploader</h3>
      <div>Status: <b>{online ? "Online" : "Offline"}</b></div>
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => machine.api.enqueue()} className="btn">Add File</button>
        <button onClick={() => machine.api.wentOffline()} className="btn">Go Offline</button>
        <button onClick={() => machine.api.cameOnline()} className="btn">Go Online</button>
      </div>
      <ul className="space-y-2">
        {Object.entries(files).map(([id, f]) => (
          <li key={id} className="p-2 border rounded">
            <div className="flex items-center gap-2">
              <code className="text-xs">{id}</code>
              <span className="ml-auto">
                <b>{f.key}</b>{f.key === "Uploading" ? ` (${f.pct ?? 0}%)` : ""}
              </span>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              <button onClick={() => machine.api.startUpload(id)} className="btn" disabled={!online}>Start</button>
              <button onClick={() => machine.api.progress(id, Math.min(100, (f.pct ?? 0) + 20))} className="btn" disabled={!online}>+20%</button>
              <button onClick={() => machine.api.uploadOk(id)} className="btn" disabled={!online}>Upload OK</button>
              <button onClick={() => machine.api.verified(id)} className="btn" disabled={!online}>Verify OK</button>
              <button onClick={() => machine.api.uploadErr(id)} className="btn">Fail</button>
              <button onClick={() => machine.api.retry(id)} className="btn">Retry</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
