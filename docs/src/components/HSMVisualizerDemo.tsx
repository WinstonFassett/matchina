import { useState, useMemo } from 'react';
import HSMMermaidInspector from './inspectors/HSMMermaidInspector';
import SketchInspector from './inspectors/SketchInspector';
import ReactFlowInspector from './inspectors/ReactFlowInspector';
import { useMachine } from 'matchina/react';

function getFullStatePath(machine: any): string {
  const currentState = machine.getState();
  if (!currentState) return 'Unknown';
  
  // Use the new fullkey property if available
  if (currentState.fullkey) {
    return currentState.fullkey;
  }
  
  // Fallback to building path manually for backward compatibility
  let path = currentState.key;
  
  // Check if there's a nested machine with an active state
  if (currentState.data?.machine) {
    const nestedState = currentState.data.machine.getState();
    if (nestedState) {
      path += '.' + nestedState.key;
      
      // Check for further nesting (e.g., Query state with fetcher machine)
      if (nestedState.data?.machine) {
        const deepNestedState = nestedState.data.machine.getState();
        if (deepNestedState) {
          path += '.' + deepNestedState.key;
        }
      }
    }
  }
  
  return path;
}

type VisualizerType = 'mermaid' | 'sketch' | 'reactflow';

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
    }
  ] as const, []);

  const renderVisualizer = () => {
    switch (activeVisualizer) {
      case 'mermaid':
        return (
          <HSMMermaidInspector 
            machine={machine} 
            actions={actions}
            interactive={interactive}
          />
        );
      case 'sketch':
        return (
          <SketchInspector 
            machine={machine} 
            actions={actions}
            interactive={interactive}
          />
        );
      case 'reactflow':
        return (
          <ReactFlowInspector 
            value={currentChange?.key || 'unknown'} 
            definition={{}}
            dispatch={() => {}}
          />
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

      {showControls && (
        <div className="visualizer-controls mb-4">
          <div className="flex flex-wrap gap-2">
            {visualizers.map(({ key, label, description: desc }) => (
              <button
                key={key}
                onClick={() => setActiveVisualizer(key as VisualizerType)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeVisualizer === key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={desc}
              >
                {label}
              </button>
            ))}
          </div>
          
          {interactive && (
            <div className="mt-2 text-xs">
              💡 Click on transitions to trigger them when available
            </div>
          )}
        </div>
      )}

      <div className="visualizer-container border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b border-neutral-200">
          <span className="text-sm font-medium">
            {visualizers.find(v => v.key === activeVisualizer)?.label}
          </span>
          <span className="text-xs ml-2">
            Current state: <strong>{getFullStatePath(machine)}</strong>
          </span>
        </div>
        
        <div className="p-4 min-h-[300px]">
          {renderVisualizer()}
        </div>
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
export { VisualizerDemo as HSMVisualizerDemo }; // Legacy export