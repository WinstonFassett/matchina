import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
import { getDefaultLayoutOptions } from './utils/elkLayout';
import type { LayoutOptions } from './utils/elkLayout';
import { saveLayoutSettings, loadLayoutSettings } from './utils/layoutStorage';
import type { LayoutSettings } from './utils/layoutStorage';

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
  const [showLayoutDialog, setShowLayoutDialog] = useState(false);
  
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
    previousState
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
    <>
      <div className="w-full h-[320px] border border-gray-200 dark:border-gray-700 rounded relative overflow-hidden">
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
            fitViewOptions={{ padding: 0.3, includeHiddenNodes: true }}
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
                onClick={() => setShowLayoutDialog(!showLayoutDialog)}
                className="bg-white dark:bg-gray-800 p-2 rounded-md shadow-md border border-gray-200 dark:border-gray-700 flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
                Layout
              </button>
            </Panel>
          </ReactFlow>
        </ReactFlowProvider>
      </div>
      
      {showLayoutDialog && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-start justify-end p-4" 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLayoutDialog(false);
          }}
        >
          <div className="mt-16 mr-4">
            <LayoutPanel 
              options={layoutOptions} 
              onOptionsChange={handleLayoutChange} 
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ReactFlowInspector;
