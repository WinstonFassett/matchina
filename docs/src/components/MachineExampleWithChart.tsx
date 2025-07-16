import { useMemo } from "react";
import { createApi } from "@lib/src";
import StateMachineMermaidDiagram from "./MachineViz";
import { getXStateDefinition } from "../code/examples/lib/matchina-machine-to-xstate-definition";

interface MachineExampleWithChartProps {
  machine: any;
  AppView?: React.ComponentType<{ machine: any }>;
  showRawState?: boolean;
  title?: string;
}

/**
 * A standardized component for displaying a machine example with a Mermaid diagram
 * and optional custom app view. Used to create consistent interactive examples
 * throughout the documentation.
 */
export function MachineExampleWithChart({ 
  machine, 
  AppView, 
  showRawState = false,
  title
}: MachineExampleWithChartProps) {
  // Get the XState definition for the Mermaid diagram
  const config = useMemo(
    () => getXStateDefinition(machine.machine),
    [machine.machine]
  );

  // Create an API for the actions
  const actions = useMemo(
    () => createApi(machine.machine, machine.state.key),
    [machine.state]
  );

  return (
    <div className="machine-example">
      {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}
      
      <div className="flex flex-col md:flex-row gap-4 w-full">
        {/* App View */}
        <div className="flex-1">
          {AppView ? (
            <AppView machine={machine} />
          ) : (
            <div className="p-4 border rounded">
              <p className="text-sm text-gray-500">Default View</p>
              <div className="text-lg font-bold">{machine.state.key}</div>
              <div className="mt-2">
                {Object.keys(actions).map(action => (
                  !action.startsWith('_') && (
                    <button
                      key={action}
                      className="mr-2 mb-2 px-3 py-1 rounded bg-blue-500 text-white text-sm"
                      onClick={() => (machine as any)[action]()}
                    >
                      {action}
                    </button>
                  )
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mermaid diagram */}
        <div className="flex-1">
          <StateMachineMermaidDiagram
            config={config}
            stateKey={machine.state.key}
            actions={actions}
          />
        </div>
      </div>

      {/* Show raw state data if requested */}
      {showRawState && (
        <div className="mt-4">
          <details>
            <summary className="cursor-pointer text-sm">Show State Data</summary>
            <pre className="text-xs mt-2 p-2 bg-gray-100 rounded">
              {JSON.stringify(machine.state.data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
