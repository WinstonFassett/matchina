import { useMemo, useState, useEffect, type ComponentType } from "react";
import { createApi } from "matchina";
import type { FactoryMachine, FactoryState } from "matchina";
import StateMachineMermaidDiagram from "./MachineViz";
import { getXStateDefinition } from "../code/examples/lib/matchina-machine-to-xstate-definition";
import { useMachine } from "matchina/react";

interface MachineExampleWithChartProps {
  machine: FactoryMachine<any> & any;
  AppView?: ComponentType<
    {
      machine: FactoryMachine<any> & T;
    } & Record<string, any>
  >;
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
  title,
}: MachineExampleWithChartProps) {
  useMachine(machine);
  const currentState = machine.getState();
  // Get the XState definition for the Mermaid diagram
  const config = useMemo(() => getXStateDefinition(machine), [machine]);

  // Create an API for the actions
  const actions = useMemo(() => createApi(machine), [machine]);

  return (
    <div className="machine-example">
      {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}

      <div className="flex flex-col md:flex-row gap-4 w-full">
        {/* Mermaid diagram */}
        <div className="flex-1">
          <StateMachineMermaidDiagram
            config={config}
            stateKey={currentState.key}
            actions={actions as any}
          />
        </div>

        {/* App View */}
        <div className="flex-1">
          {AppView ? (
            <AppView machine={machine} />
          ) : (
            <div className="p-4 border rounded">
              <p className="text-sm text-gray-500">Current State</p>
              <div className="text-lg font-bold">{currentState.key}</div>
              <div className="mt-2">
                {Object.keys(actions).map(
                  (action) =>
                    !action.startsWith("_") && (
                      <button
                        key={action}
                        className="mr-2 mb-2 px-3 py-1 rounded bg-blue-500 text-white text-sm"
                        onClick={() => machine.send(action)}
                      >
                        {action}
                      </button>
                    ),
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Show raw state data if requested */}
      {showRawState && (
        <div className="mt-4">
          <details>
            <summary className="cursor-pointer text-sm">
              Show State Data
            </summary>
            <pre className="text-xs mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
              {JSON.stringify(currentState.data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
