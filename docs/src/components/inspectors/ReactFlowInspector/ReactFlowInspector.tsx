import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  ConnectionLineType,
  MarkerType,
  ReactFlowProvider,
  BackgroundVariant,
} from 'reactflow';
import type { NodeTypes } from 'reactflow';
import 'reactflow/dist/style.css';

import CustomNode from './CustomNode';
import { useStateMachineNodes } from './useStateMachineNodes';
import { useStateMachineEdges } from './useStateMachineEdges';
import { getDefaultLayoutOptions } from './elkLayout';

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
  
  // Track state changes for previous state highlighting
  useEffect(() => {
    if (prevState) {
      setPreviousState(prevState);
    }
    if (lastEvent) {
      setLastTriggeredEvent(lastEvent);
    }
  }, [value, prevState, lastEvent]);

  const layoutOptions = useMemo(() => getDefaultLayoutOptions(), []);

  const { nodes, onNodesChange, isInitialized } = useStateMachineNodes(
    definition,
    value,
    previousState,
    undefined,
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
    <div className="w-full h-[320px] border border-gray-200 rounded">
      <style>{edgeAnimationStyles}</style>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeClick={handleEdgeClick}
          connectionLineType={ConnectionLineType.SmoothStep}
          defaultEdgeOptions={{
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
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default ReactFlowInspector;
