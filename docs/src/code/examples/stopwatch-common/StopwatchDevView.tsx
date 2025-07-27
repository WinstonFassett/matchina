import StateMachineMermaidDiagram from "@components/MachineViz";
import { createApi } from "matchina";
import { useMemo } from "react";
import { getXStateDefinition } from "../lib/matchina-machine-to-xstate-definition";
import type { Stopwatch } from "./types";
import { StopwatchView } from "./StopwatchView";

export function StopwatchDevView({ stopwatch }: { stopwatch: Stopwatch }) {
  const config = useMemo(
    () => getXStateDefinition(stopwatch as any),
    [stopwatch]
  );
  const actions = useMemo(
    () => createApi(stopwatch as any),
    [stopwatch.getState()]
  );

  return (
    <div style={{ width: "100%", display: "flex", gap: "1em" }}>
      <div style={{ flex: 2 }}>
        <StopwatchView stopwatch={stopwatch} />
        <StateMachineMermaidDiagram
          config={config}
          stateKey={stopwatch.getState().key}
          actions={actions}
        />
      </div>
      <pre className="text-xs flex-1">
        {JSON.stringify(stopwatch.getState().data, null, 2)}
        {/* {JSON.stringify(getXStateDefinition(stopwatch), null, 2)} */}
      </pre>
    </div>
  );
}
