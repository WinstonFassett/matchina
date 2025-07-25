import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  ConnectionLineType,
  MarkerType,
  ReactFlowProvider,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import type { NodeTypes, EdgeTypes } from 'reactflow';
import 'reactflow/dist/style.css';

import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';
import LayoutPanel from './LayoutPanel';
import { useStateMachineNodes } from './hooks/useStateMachineNodes';
import { useStateMachineEdges } from './hooks/useStateMachineEdges';
import { getDefaultLayoutOptions, LayoutOptions } from './utils/elkLayout';
import { saveLayoutSettings, loadLayoutSettings, LayoutSettings } from './utils/layoutStorage';

// Add CSS for edge animations
const edgeAnimationStyles = `
@keyframes dash {
  from {
    stroke-dashoffset: 10;
  }
  to {
    stroke-dashoffset: 0;
  }
}
`;

interface ReactFlowInspectorProps {
  value: string;
  definition: any;
  lastEvent?: string;
  prevState?: string;
  dispatch: (event: { type: string }) => void;
  mode?: any;
}

const nodeTypes: NodeTypes = {
  custom: CustomNode as any, // Type assertion to avoid complex generic issues
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge as any,
};

const ReactFlowInspector: React.FC<ReactFlowInspectorProps> = ({
  value,
  definition,
  lastEvent,
  prevState,
  dispatch,
  mode,
}) => {
  const [previousState, setPreviousState] = useState<string | null>(null);
  const [lastTriggeredEvent, setLastTriggeredEvent] = useState<string | undefined>(lastEvent);
  const instanceId = useRef(Math.random().toString(36).substring(2, 9));
  const [showLayoutPanel, setShowLayoutPanel] = useState(false);
  
  // Track state changes for previous state highlighting
  useEffect(() => {
    if (prevState) {
      setPreviousState(prevState);
    }
    if (lastEvent) {
      setLastTriggeredEvent(lastEvent);
    }
  }, [value, prevState, lastEvent]);

  // Load saved layout settings or use defaults
  const [layoutOptions, setLayoutOptions] = useState<LayoutOptions>(() => {
    const saved = loadLayoutSettings();
    return saved || getDefaultLayoutOptions();
  });
  
  const handleLayoutChange = useCallback((newOptions: LayoutOptions) => {
    setLayoutOptions(newOptions);
    saveLayoutSettings(newOptions);
  }, []);

  // Use a key to force remount when definition changes
  const machineKey = useRef<number>(0);
  useEffect(() => {
    machineKey.current += 1;
  }, [definition]);

  const { nodes, onNodesChange, isInitialized } = useStateMachineNodes(
    definition,
    value,
    previousState,
    machineKey.current,
    layoutOptions
  );

  const { edges, onEdgesChange, updateEdges } = useStateMachineEdges(
    definition,
    nodes,
    value,
    previousState,
    lastTriggeredEvent
  );

  // Update edges when nodes change (positions or states)
  useEffect(() => {
    if (isInitialized && nodes.length > 0) {
      updateEdges();
    }
  }, [nodes, updateEdges, isInitialized]);

  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: any) => {
    event.stopPropagation();
    const eventType = edge.data?.event;
    const isClickable = edge.data?.isClickable;
    if (eventType && isClickable) {
      dispatch({ type: eventType });
    }
  }, [dispatch]);

  return (
    <div className="w-full h-[320px] border border-gray-200 rounded relative">
      <style>{edgeAnimationStyles}</style>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeClick={handleEdgeClick}
          connectionLineType={ConnectionLineType.SmoothStep}
          defaultEdgeOptions={{
            type: 'custom',
            markerEnd: { type: MarkerType.ArrowClosed },
          }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Controls 
            showZoom={true}
            showFitView={true}
            showInteractive={false}
            position="bottom-right"
          />
          <Background variant={"dots" as BackgroundVariant} gap={20} size={1} />
          
          {/* Layout Options Button */}
          <Panel position="top-right">
            <button 
              onClick={() => setShowLayoutPanel(!showLayoutPanel)}
              className="bg-white p-2 rounded-md shadow-md border border-gray-200 flex items-center gap-1 text-xs font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
              Layout
            </button>
          </Panel>
          
          {/* Layout Panel */}
          {showLayoutPanel && (
            <Panel position="top-right" className="mt-10">
              <LayoutPanel 
                options={layoutOptions} 
                onOptionsChange={handleLayoutChange} 
              />
            </Panel>
          )}
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default ReactFlowInspector;
