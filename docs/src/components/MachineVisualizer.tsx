/**
 * Unified machine visualizer component
 * Replaces MachineExampleWithChart and HSMVisualizerDemo with consistent API
 */

import type { FactoryMachine } from "matchina";
import { eventApi } from "matchina";
import { useMachine } from "matchina/react";
import { BlockInspector } from "@matchina/viz-react";
import { HSMReactFlowInspector } from "@matchina/viz-reactflow";
import { SvgInspector, type ElkLayoutOptions } from "@matchina/viz-svg";
// import { MermaidInspector } from "@matchina/viz-mermaid";
// import { ForceGraphInspector } from "@matchina/viz-forcegraph";
import { useMemo, useState, type ComponentType } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { getActiveStatePath } from "../code/examples/lib/matchina-machine-to-xstate-definition";
import { VizPicker, type VisualizerType } from "./VizPicker";

export interface MachineVisualizerProps {
  // Core props
  machine: FactoryMachine<any>;
  AppView?: ComponentType<
    {
      machine: FactoryMachine<any> & any;
    } & Record<string, any>
  >;

  // Visualizer configuration
  defaultViz?: VisualizerType;
  availableViz?: VisualizerType[];
  showPicker?: boolean;
  defaultSvgDirection?: 'RIGHT' | 'DOWN';

  // Layout configuration
  layout?: "split" | "stacked";
  vizPosition?: "left" | "right" | "top" | "bottom";
  minVizHeight?: number;

  // Interactivity (prop, not UI toggle)
  interactive?: boolean;

  // Display options
  showRawState?: boolean;
  title?: string;

  // Additional
  className?: string;
  
  // Legacy/example props (ignored but accepted for compatibility)
  exampleName?: string;
  preset?: string;
}

/**
 * Unified visualizer component with consistent UX across all examples
 */
export function MachineVisualizer({
  machine,
  AppView,
  defaultViz = "reactflow",
  availableViz,
  showPicker = true,
  layout = "split",
  vizPosition = "left",
  minVizHeight = 400,
  interactive = true,
  showRawState = false,
  title,
  className = "",
  defaultSvgDirection = 'RIGHT',
}: MachineVisualizerProps) {
  const [currentViz, setCurrentViz] = useState<VisualizerType>(defaultViz);

  // SVG layout knobs
  const [svgDirection, setSvgDirection] = useState<'RIGHT' | 'DOWN'>(defaultSvgDirection);
  const [svgNodeSpacing, setSvgNodeSpacing] = useState(40);
  const [svgLayerSpacing, setSvgLayerSpacing] = useState(60);
  const svgLayoutOptions: ElkLayoutOptions = useMemo(
    () => ({ direction: svgDirection, nodeSpacing: svgNodeSpacing, layerSpacing: svgLayerSpacing }),
    [svgDirection, svgNodeSpacing, svgLayerSpacing]
  );

  // Machine state and actions
  // CRITICAL: useMachine must be called in MachineVisualizer to subscribe to state changes
  // This ensures the entire component (including AppView) re-renders when machine state changes
  // Without this, AppView might be rendered with stale state if it only reads machine.getState()
  const change = useMachine(machine);
  const currentState = machine.getState();
  // Explicitly depend on 'change' to ensure activeStatePath updates when state changes
  const activeStatePath = useMemo(
    () => getActiveStatePath(machine),
    [machine, change]
  );
  // Get shape for visualizers - all visualizers should use MachineShape
  const shape = useMemo(
    () => (machine as any).shape?.getState(),
    [machine, change]
  );
  const actions = useMemo(() => eventApi(machine), [machine]);

  // Determine if we should show the picker
  const effectiveShowPicker =
    showPicker && (availableViz ? availableViz.length > 1 : true);

  // Responsive layout classes
  const isSplit = layout === "split";
  const isVizLeft = vizPosition === "left";

  const containerClasses = [
    isSplit ? "flex flex-row gap-4 flex-1 min-h-0" : "flex flex-col gap-4",
    isSplit && !isVizLeft ? "flex-row-reverse" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const vizContainerClasses = [
    "visualizer-container",
    isSplit ? "flex-1 min-h-0 h-full" : `w-full`,
  ]
    .filter(Boolean)
    .join(" ");

  const appContainerClasses = ["app-container", isSplit ? "flex-1 min-h-0 h-full" : "w-full"]
    .filter(Boolean)
    .join(" ");

  const stackedHeightStyle = isSplit ? undefined : { minHeight: `${minVizHeight}px` };

  return (
    <div data-testid="machine-visualizer" className={`flex flex-col ${isSplit ? "h-full" : ""} ${className}`}>
      {/* Title */}
      {title && <h3 className="text-lg font-medium shrink-0">{title}</h3>}

      {/* Controls header */}
      {effectiveShowPicker && (
        <div
          className="flex flex-wrap items-center gap-3 p-3 bg-muted/40 border border-border shrink-0"
          data-testid="visualizer-controls"
        >
          <VizPicker
            value={currentViz}
            onChange={setCurrentViz}
            availableViz={availableViz}
          />
          {currentViz === "svg" && (
            <div className="flex items-center gap-3 border-l border-border pl-3" data-testid="svg-layout-controls">
              <label className="text-sm font-medium text-foreground">Direction:</label>
              <select
                value={svgDirection}
                onChange={(e) => setSvgDirection(e.target.value as 'RIGHT' | 'DOWN')}
                className="px-2 py-1 text-sm border border-border bg-background text-foreground"
                data-testid="svg-direction"
              >
                <option value="RIGHT">Right</option>
                <option value="DOWN">Down</option>
              </select>
              <label className="text-sm font-medium text-foreground">Node gap:</label>
              <input
                type="number"
                min={10}
                max={200}
                step={10}
                value={svgNodeSpacing}
                onChange={(e) => setSvgNodeSpacing(Number(e.target.value))}
                className="w-16 px-2 py-1 text-sm border border-border bg-background text-foreground"
                data-testid="svg-node-spacing"
              />
              <label className="text-sm font-medium text-foreground">Layer gap:</label>
              <input
                type="number"
                min={10}
                max={300}
                step={10}
                value={svgLayerSpacing}
                onChange={(e) => setSvgLayerSpacing(Number(e.target.value))}
                className="w-16 px-2 py-1 text-sm border border-border bg-background text-foreground"
                data-testid="svg-layer-spacing"
              />
            </div>
          )}
        </div>
      )}

      {/* Main content area */}
      <div className={containerClasses} style={stackedHeightStyle}>
        {/* Visualizer */}
        <div data-testid="visualizer-container" className={vizContainerClasses}>
          {renderVisualizer({
            type: currentViz,
            machine,
            activeStatePath,
            shape,
            actions,
            interactive,
            svgLayoutOptions,
            showPicker: effectiveShowPicker,
          })}
        </div>

        {/* App View */}
        <div data-testid="app-container" className={appContainerClasses}>
          {AppView ? (
            <AppView machine={machine} />
          ) : (
            <DefaultAppView
              activeStatePath={activeStatePath}
              actions={actions}
              machine={machine}
            />
          )}
        </div>
      </div>

      {/* Raw state debug panel */}
      {showRawState && (
        <details>
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Show State Data
          </summary>
          <pre className="text-xs mt-2 p-2 bg-muted overflow-auto">
            {JSON.stringify(currentState.data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

/**
 * Renders the appropriate visualizer component based on type
 */
function renderVisualizer({
  type,
  machine,
  activeStatePath,
  shape,
  actions: _actions,
  interactive,
  svgLayoutOptions,
  showPicker,
}: {
  type: VisualizerType;
  machine: FactoryMachine<any>;
  activeStatePath: string;
  shape: any;
  actions: Record<string, any>;
  interactive: boolean;
  svgLayoutOptions: ElkLayoutOptions;
  showPicker: boolean;
}) {
  const commonClasses =
    "w-full h-full border border-border overflow-auto";

  switch (type) {
    case "reactflow":
      return (
        <div className={commonClasses}>
          <ReactFlowProvider>
            <HSMReactFlowInspector
              machine={machine as any}
              interactive={interactive}
              showLayoutControls={showPicker}
            />
          </ReactFlowProvider>
        </div>
      );

    // case "forcegraph":
    //   // 🚡 DEPRECATED: ForceGraph Inspector is marked for retirement
    //   // Consider using ReactFlow (default) or Mermaid visualizers instead
    //   console.warn(
    //     "ForceGraph Inspector is deprecated and will be removed in a future version. " +
    //     "Consider using the ReactFlow visualizer (default) for better performance and features."
    //   );
    //   // ForceGraph needs explicit height constraint - it doesn't respect h-full well
    //   return (
    //     <div
    //       className={commonClasses}
    //       style={{ height: "100%", maxHeight: "400px" }}
    //     >
    //       <ForceGraphInspector
    //         value={activeStatePath}
    //         definition={machine as any}
    //         dispatch={(event: any) => {
    //           const eventName = typeof event === "string" ? event : event?.type;
    //           if (eventName && actions[eventName]) {
    //             machine.send(eventName);
    //           }
    //         }}
    //         interactive={interactive}
    //       />
    //     </div>
    //   );

    case "sketch":
      return (
        <div className={commonClasses}>
          <BlockInspector machine={machine} interactive={interactive} />
        </div>
      );

    case "svg":
      return (
        <div className={commonClasses} style={{ overflow: "hidden" }}>
          <SvgInspector
            shape={shape}
            value={activeStatePath}
            onFire={(event) => machine.send(event)}
            options={svgLayoutOptions}
            interactive={interactive}
          />
        </div>
      );

    // case "mermaid-statechart":
    //   return (
    //     <div
    //       className={commonClasses}
    //       data-testid="mermaid-statechart-container"
    //     >
    //       <MermaidInspector
    //         shape={shape}
    //         currentStateKey={activeStatePath}
    //         actions={actions}
    //         interactive={interactive}
    //         diagramType="statechart"
    //       />
    //     </div>
    //   );

    // case "mermaid-flowchart":
    //   return (
    //     <div className={commonClasses}>
    //       <MermaidInspector
    //         shape={shape}
    //         currentStateKey={activeStatePath}
    //         actions={actions}
    //         interactive={interactive}
    //         diagramType="flowchart"
    //       />
    //     </div>
    //   );

    default:
      return (
        <div className="p-4 border border-border">
          <p className="text-sm text-foreground">
            Visualizer type "{type}" not available
          </p>
        </div>
      );
  }
}

/**
 * Default app view when no custom view is provided
 */
function DefaultAppView({
  activeStatePath,
  actions,
  machine,
}: {
  activeStatePath: string;
  actions: Record<string, any>;
  machine: FactoryMachine<any>;
}) {
  return (
    <div className="p-4 border border-border h-full flex flex-col">
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Current State
        </p>
        <div className="text-lg font-bold text-foreground">
          {activeStatePath}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.keys(actions).map(
          (action) =>
            !action.startsWith("_") && (
              <button
                type="button"
                key={action}
                className="px-3 py-1 border border-border bg-muted hover:bg-muted/70 text-foreground text-sm transition-colors"
                onClick={() => machine.send(action)}
              >
                {action}
              </button>
            )
        )}
      </div>
    </div>
  );
}
