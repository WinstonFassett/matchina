import StateMachineMermaidDiagram from "@components/MachineViz";
import { createApi } from "@lib/src";
import { useMemo } from "react";
import { getXStateDefinition } from "../lib/matchina-machine-to-xstate-definition";
import type { Stopwatch } from "./types";
import { StopwatchView } from "./StopwatchView";


export function StopwatchDevView({ stopwatch }: { stopwatch: Stopwatch; }) {
  const config = useMemo(
    () => getXStateDefinition(stopwatch.machine),
    [stopwatch.machine]
  );
  const actions = useMemo(
    () => createApi(stopwatch.machine, stopwatch.state.key),
    [stopwatch.state]
  );

  return (
    <div style={{ width: "100%", display: "flex", gap: "1em" }}>
      <div style={{ flex: 2 }}>
        <StopwatchView stopwatch={stopwatch} />
        <StateMachineMermaidDiagram
          config={config}
          stateKey={stopwatch.state.key}
          actions={actions} />
      </div>
      <pre className="text-xs flex-1">
        {JSON.stringify(stopwatch.state.data, null, 2)}
        {/* {JSON.stringify(getXStateDefinition(stopwatch.machine), null, 2)} */}
      </pre>
    </div>
  );
}
