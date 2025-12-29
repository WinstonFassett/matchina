import { useState, useMemo, useEffect } from 'react';
import { HSMMermaidInspector, SketchInspector, ReactFlowInspector, ForceGraphInspector, defaultTheme } from 'matchina/viz';
import { useMachine } from 'matchina/react';
import { getActiveStatePath } from '../code/examples/lib/matchina-machine-to-xstate-definition';

type VisualizerType = 'mermaid' | 'sketch' | 'reactflow' | 'forcegraph';

interface VisualizerDemoProps {
  machine: any;
  actions?: Record<string, () => void>;
  title?: string;
  description?: string;
  defaultVisualizer?: VisualizerType;
  showControls?: boolean;
  interactive?: boolean;
  className?: string;
}

export function VisualizerDemo({
  machine,
  actions,
  title,
  description,
  defaultVisualizer = 'sketch',
  showControls = true,
  interactive = true,
  className = ''
}: VisualizerDemoProps) {
  const [activeVisualizer, setActiveVisualizer] = useState<VisualizerType>(defaultVisualizer);
  const currentChange = useMachine(machine) as any;
  const [lastEvent, setLastEvent] = useState<string>();
  const [prevState, setPrevState] = useState<string>();
  
  // Also subscribe to active child (first level) to catch child-only transitions
  const cs = machine.getState?.();
  const child = cs?.data?.machine;
  useMachine(child || machine);
  
  // Track events for ForceGraphInspector
  useEffect(() => {
    if (currentChange?.key && currentChange?.key !== prevState) {
      setPrevState(currentChange.key);
      // Extract event type from change if available
      const eventType = currentChange?.event?.type || 'unknown';
      setLastEvent(eventType);
    }
  }, [currentChange, prevState]);
  const visualizers = useMemo(() => [
    { 
      key: 'sketch', 
      label: 'Sketch Systems Style',
      description: 'Nested hierarchical layout inspired by sketch.systems'
    },
    { 
      key: 'mermaid', 
      label: 'Mermaid Diagram',
      description: 'Flow chart with hierarchical clustering'
    },
    { 
      key: 'reactflow', 
      label: 'React Flow',
      description: 'Interactive node-based visualization'
    },
    { 
      key: 'forcegraph', 
      label: 'Force Graph',
      description: 'Force-directed graph visualization'
    }
  ] as const, []);

  const activeStatePath = getActiveStatePath(machine);
  const isInteractive = interactive;

  const renderVisualizer = () => {
    switch (activeVisualizer) {
      case 'mermaid':
        return (
          <div className="w-full h-full min-h-[320px]">
            <HSMMermaidInspector
              machine={machine}
              stateKey={activeStatePath}
              actions={actions as any}
              interactive={isInteractive}
            />
          </div>
        );
      case 'sketch':
        return (
          <div className="w-full h-full min-h-[320px] overflow-auto">
            <SketchInspector 
              machine={machine} 
              actions={actions}
              interactive={interactive}
              theme={defaultTheme}
            />
          </div>
        );
      case 'reactflow':
        return (
          <div className="w-full h-full min-h-[320px]">
            <ReactFlowInspector 
              value={currentChange?.key || 'unknown'} 
              definition={machine}
              lastEvent={lastEvent}
              prevState={prevState}
              dispatch={(event: any) => {
                if (actions && typeof event === 'string' && actions[event]) {
                  actions[event]();
                }
              }}
              interactive={interactive}
            />
          </div>
        );
      case 'forcegraph':
        return (
          <div className="w-full h-full min-h-[320px] flex items-center justify-center">
            <ForceGraphInspector 
              value={currentChange?.key || 'unknown'} 
              definition={machine}
              lastEvent={lastEvent}
              prevState={prevState}
              dispatch={(event: any) => {
                if (actions && typeof event === 'string' && actions[event]) {
                  actions[event]();
                }
              }}
              interactive={interactive}
              theme={defaultTheme}
            />
          </div>
        );
      default:
        return <div>Unknown visualizer type</div>;
    }
  };

  return (
    <div className={`hsm-visualizer-demo ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
      )}
      
      {description && (
        <p className="text-sm mb-4">{description}</p>
      )}

      {/* UI Controls Section */}
      {showControls && (
        <div className="visualizer-controls mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Visualizer:</span>
            {visualizers.map((viz) => (
              <button
                key={viz.key}
                onClick={() => setActiveVisualizer(viz.key)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeVisualizer === viz.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
                title={viz.description}
              >
                {viz.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Visualizer Display Section */}
      <div className="visualizer-display p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm" style={{ width: '100%', height: '400px', position: 'relative' }}>
        {renderVisualizer()}
      </div>

      {currentChange?.data && (
        <div className="mt-4 p-3 rounded-md">
          <div className="text-sm font-medium mb-1">State Data:</div>
          <pre className="text-xs font-mono">
            {JSON.stringify(currentChange.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default VisualizerDemo;