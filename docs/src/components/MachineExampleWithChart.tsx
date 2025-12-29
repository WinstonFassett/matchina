import type { FactoryMachine } from "matchina";
import { eventApi } from "matchina";
import { useMachine } from "matchina/react";
import { useMemo, useState, type ComponentType } from "react";
import { buildVisualizerTree, getActiveStatePath } from "../code/examples/lib/matchina-machine-to-xstate-definition";
import { MermaidInspector, ReactFlowInspector } from 'matchina/viz';

interface MachineExampleWithChartProps {
  machine: FactoryMachine<any>;
  AppView?: ComponentType<
    {
      machine: FactoryMachine<any> & any;
    } & Record<string, any>
  >;
  showRawState?: boolean;
  title?: string;
  inspectorType?: "mermaid" | "force-graph" | "react-flow" | "basic";
  interactive?: boolean;
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
  inspectorType = "force-graph",
  interactive = true,
}: MachineExampleWithChartProps) {
  useMachine(machine);
  const currentState = machine.getState();
  // Get the full active state path for nested machines
  const activeStatePath = getActiveStatePath(machine);
  // Get the XState definition for the Mermaid diagram
  const config = useMemo(() => buildVisualizerTree(machine), [machine]);
  // Create an API for the actions
  const actions = useMemo(() => eventApi(machine), [machine]);
  const lastChange = machine.getChange();
  
  // Local state for inspector type and diagram type
  const [currentInspectorType, setCurrentInspectorType] = useState<"mermaid" | "force-graph" | "react-flow" | "basic">(inspectorType);
  const [diagramType, setDiagramType] = useState<'flowchart' | 'statechart'>('statechart');
  const [isInteractive, setIsInteractive] = useState(interactive);
  
  return (
    <div className="machine-example">
      {/* Title */}
      {title && <h3 className="text-lg font-medium mb-3">{title}</h3>}
      
      {/* Compact controls header */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4 border border-gray-200 dark:border-gray-700">
        {/* Visualization type dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</label>
          <select
            value={currentInspectorType}
            onChange={(e) => setCurrentInspectorType(e.target.value as typeof currentInspectorType)}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="force-graph">Force Graph</option>
            <option value="react-flow">React Flow</option>
            <option value="mermaid">State Chart</option>
            <option value="basic">Basic</option>
          </select>
        </div>
        
        {/* Diagram type dropdown for Mermaid */}
        {currentInspectorType === "mermaid" && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</label>
            <select
              value={diagramType}
              onChange={(e) => setDiagramType(e.target.value as typeof diagramType)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="statechart">State Chart</option>
              <option value="flowchart">Flowchart</option>
            </select>
          </div>
        )}
        
        {/* Interactive toggle */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Interactive:</label>
          <button
            onClick={() => setIsInteractive(!isInteractive)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              isInteractive 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500'
            }`}
          >
            {isInteractive ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      <div className={`flex flex-col md:flex-row gap-4 w-full ${currentInspectorType === "mermaid" ? "lg:flex-row-reverse" : ""}`}>
        {/* Mermaid diagram */}
        <div className={`flex-1 ${currentInspectorType === "mermaid" ? "lg:flex-2" : ""}`}>
          {currentInspectorType === "basic" && (
            <div className="p-4 border border-gray-300 rounded">
              <p className="text-sm text-gray-600">Basic Inspector not available - use Mermaid or ReactFlow</p>
            </div>
          )}
          {currentInspectorType === "mermaid" && (
            <MermaidInspector
              config={config}
              stateKey={activeStatePath}
              actions={actions as any}
              interactive={isInteractive}
            />
          )}
          {currentInspectorType === "force-graph" && (
            <div className="p-4 border border-gray-300 rounded">
              <p className="text-sm text-gray-600">Force Graph Inspector not available - use Mermaid or ReactFlow</p>
            </div>
          )}
          {currentInspectorType === "react-flow" && (
            <ReactFlowInspector
              value={activeStatePath}
              lastEvent={lastChange?.type}
              prevState={lastChange.from?.key}
              mode={currentState.data}
              definition={config}
              dispatch={({ type }: { type: string }) => machine.send(type)}
              interactive={isInteractive}
            />
          )}
        </div>

        {/* App View */}
        <div className={`flex-1 ${currentInspectorType === "mermaid" ? "lg:flex-1" : ""}`}>
          {AppView ? (
            <AppView machine={machine} />
          ) : (
            <div className="p-4 border rounded">
              <p className="text-sm text-gray-500">Current State</p>
              <div className="text-lg font-bold">{activeStatePath}</div>
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
                    )
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
