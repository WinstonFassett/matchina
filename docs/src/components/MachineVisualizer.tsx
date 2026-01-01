/**
 * Unified machine visualizer component
 * Replaces MachineExampleWithChart and HSMVisualizerDemo with consistent API
 */

import type { FactoryMachine } from "matchina";
import { eventApi } from "matchina";
import { useMachine } from "matchina/react";
import { useMemo, useState, type ComponentType } from "react";
import { buildVisualizerTree, getActiveStatePath } from "../code/examples/lib/matchina-machine-to-xstate-definition";
import {
  MermaidInspector,
  HSMReactFlowInspector,
  ForceGraphInspector,
  SketchInspector,
} from 'matchina/viz';
import { VizPicker, type VisualizerType } from './VizPicker';
import { selectBestVisualizer, getPresetConfig } from './vizAutoSelect';

export interface MachineVisualizerProps {
  // Core props
  machine: FactoryMachine<any>;
  AppView?: ComponentType<{
    machine: FactoryMachine<any> & any;
  } & Record<string, any>>;

  // Visualizer configuration
  defaultViz?: VisualizerType | 'auto';
  availableViz?: VisualizerType[];
  showPicker?: boolean;

  // Layout configuration
  layout?: 'split' | 'stacked' | 'auto';
  vizPosition?: 'left' | 'right' | 'top' | 'bottom';
  minVizHeight?: number;

  // Interactivity (prop, not UI toggle)
  interactive?: boolean;

  // Display options
  showRawState?: boolean;
  title?: string;

  // Preset configurations
  preset?: 'simple' | 'hierarchical' | 'complex' | 'minimal';

  // Additional
  className?: string;
}

/**
 * Unified visualizer component with consistent UX across all examples
 */
export function MachineVisualizer({
  machine,
  AppView,
  defaultViz = 'auto',
  availableViz,
  showPicker,
  layout = 'split',
  vizPosition = 'left',
  minVizHeight = 400,
  interactive = true,
  showRawState = false,
  title,
  preset,
  className = '',
}: MachineVisualizerProps) {
  // Apply preset configuration if provided
  const presetConfig = preset ? getPresetConfig(preset) : null;

  // Resolve configuration with preset fallbacks
  const resolvedDefaultViz = presetConfig?.defaultViz ?? defaultViz;
  const resolvedAvailableViz = availableViz ?? presetConfig?.availableViz;
  const resolvedShowPicker = showPicker ?? presetConfig?.showPicker ?? true;
  const resolvedLayout = presetConfig?.layout ?? layout;

  // Initialize visualizer selection
  const initialViz = resolvedDefaultViz === 'auto'
    ? selectBestVisualizer(machine)
    : resolvedDefaultViz as VisualizerType;

  const [currentViz, setCurrentViz] = useState<VisualizerType>(initialViz);

  // Machine state and actions
  // CRITICAL: useMachine must be called in MachineVisualizer to subscribe to state changes
  // This ensures the entire component (including AppView) re-renders when machine state changes
  // Without this, AppView might be rendered with stale state if it only reads machine.getState()
  const change = useMachine(machine);
  const currentState = machine.getState();
  // Explicitly depend on 'change' to ensure activeStatePath updates when state changes
  const activeStatePath = useMemo(() => getActiveStatePath(machine), [machine, change]);
  // Explicitly depend on 'change' to ensure visualizer config updates when state changes
  const config = useMemo(() => buildVisualizerTree(machine), [machine, change]);
  const actions = useMemo(() => eventApi(machine), [machine]);

  // Determine if we should show the picker
  const effectiveShowPicker = resolvedShowPicker && (
    resolvedAvailableViz ? resolvedAvailableViz.length > 1 : true
  );

  // Responsive layout classes
  const isSplit = resolvedLayout === 'split';
  const isVizLeft = vizPosition === 'left';

  const containerClasses = [
    'machine-visualizer',
    className,
    isSplit ? 'flex flex-col md:flex-row gap-4' : 'flex flex-col gap-4',
    isSplit && !isVizLeft ? 'md:flex-row-reverse' : '',
  ].filter(Boolean).join(' ');

  const vizContainerClasses = [
    'visualizer-container',
    isSplit ? 'flex-1 h-full' : 'w-full',
  ].filter(Boolean).join(' ');

  const appContainerClasses = [
    'app-container',
    isSplit ? 'flex-1 h-full' : 'w-full',
  ].filter(Boolean).join(' ');

  // Height styling
  // For split layout, use explicit height so flex children can use h-full
  // For stacked layout, use min-height to allow content to grow
  const heightStyle = isSplit
    ? { height: `${minVizHeight}px` }
    : { minHeight: `${minVizHeight}px` };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Title */}
      {title && <h3 className="text-lg font-medium">{title}</h3>}

      {/* Controls header */}
      {effectiveShowPicker && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <VizPicker
            value={currentViz}
            onChange={setCurrentViz}
            availableViz={resolvedAvailableViz}
          />
        </div>
      )}

      {/* Main content area */}
      <div className={containerClasses} style={heightStyle}>
        {/* Visualizer */}
        <div className={vizContainerClasses}>
          {renderVisualizer({
            type: currentViz,
            machine,
            activeStatePath,
            config,
            actions,
            interactive,
          })}
        </div>

        {/* App View */}
        <div className={appContainerClasses}>
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
          <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400">
            Show State Data
          </summary>
          <pre className="text-xs mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto">
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
  config,
  actions,
  interactive,
}: {
  type: VisualizerType;
  machine: FactoryMachine<any>;
  activeStatePath: string;
  config: any;
  actions: Record<string, any>;
  interactive: boolean;
}) {
  const commonClasses = "w-full h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-auto";

  switch (type) {
    case 'reactflow':
      return (
        <div className={commonClasses}>
          <HSMReactFlowInspector
            machine={machine as any}
            interactive={interactive}
          />
        </div>
      );

    case 'forcegraph':
      return (
        <div className={commonClasses}>
          <ForceGraphInspector
            value={activeStatePath}
            definition={machine as any}
            dispatch={(event: any) => {
              const eventName = typeof event === 'string' ? event : event?.type;
              if (eventName && actions[eventName]) {
                machine.send(eventName);
              }
            }}
            interactive={interactive}
          />
        </div>
      );

    case 'sketch':
      return (
        <div className={commonClasses}>
          <SketchInspector
            machine={machine}
            interactive={interactive}
          />
        </div>
      );

    case 'mermaid-statechart':
      return (
        <div className={commonClasses}>
          <MermaidInspector
            config={config}
            stateKey={activeStatePath}
            actions={actions}
            interactive={interactive}
            diagramType="statechart"
          />
        </div>
      );

    case 'mermaid-flowchart':
      return (
        <div className={commonClasses}>
          <MermaidInspector
            config={config}
            stateKey={activeStatePath}
            actions={actions}
            interactive={interactive}
            diagramType="flowchart"
          />
        </div>
      );

    default:
      return (
        <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
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
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg h-full flex flex-col">
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Current State</p>
        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {activeStatePath}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.keys(actions).map((action) =>
          !action.startsWith("_") && (
            <button
              key={action}
              className="px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm transition-colors"
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
