import { MermaidInspector } from "matchina/viz";
import { eventApi } from "matchina";
import { useMemo } from "react";
import { buildVisualizerTree } from "../lib/matchina-machine-to-xstate-definition";
import type { Stopwatch } from "./types";
import { StopwatchView } from "./StopwatchView";

export function StopwatchDevView({ stopwatch }: { stopwatch: Stopwatch }) {
  const config = useMemo(
    () => buildVisualizerTree(stopwatch as any),
    [stopwatch]
  );
  const actions = useMemo(
    () => eventApi(stopwatch as any),
    [stopwatch.getState()]
  );

  return (
    <div style={{ width: "100%", display: "flex", gap: "1em" }}>
      <div style={{ flex: 2 }}>
        <StopwatchView stopwatch={stopwatch} />
        <MermaidInspector
          config={config}
          stateKey={stopwatch.getState().key}
          actions={actions}
        />
      </div>
      <pre className="text-xs flex-1">
        {JSON.stringify(stopwatch.getState().data, null, 2)}
        {/* {JSON.stringify(buildVisualizerTree(stopwatch), null, 2)} */}
      </pre>
    </div>
  );
}
