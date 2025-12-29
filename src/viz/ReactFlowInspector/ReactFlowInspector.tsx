import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { EdgeTypes, NodeTypes } from "reactflow";
import ReactFlow, {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Controls,
  MarkerType,
  Panel,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

import CustomEdge from "./CustomEdge";
import CustomNode from "./CustomNode";
import LayoutPanel from "./LayoutPanel";
import { useStateMachineEdges } from "./hooks/useStateMachineEdges";
import { useStateMachineNodes } from "./hooks/useStateMachineNodes";
import type { LayoutOptions } from "./utils/elkLayout";
import { getDefaultLayoutOptions } from "./utils/elkLayout";
import { loadLayoutSettings, saveLayoutSettings } from "./utils/layoutStorage";

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
  nodes: Node[];
  edges: Edge[];
  previousState?: string;
  dispatch: (event: { type: string }) => void;
  layoutOptions?: LayoutOptions;
  interactive?: boolean; // Controls whether edges can be clicked to trigger transitions
}

const nodeTypes: NodeTypes = {
  custom: CustomNode as any, // Type assertion to avoid complex generic issues
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge as any,
};

const ReactFlowInspector: React.FC<ReactFlowInspectorProps> = ({
  value,
  nodes: initialNodes,
  edges: initialEdges,
  previousState,
  dispatch,
  layoutOptions,
  interactive = true,
}) => {
  const [showLayoutDialog, setShowLayoutDialog] = useState(false);

  // Load saved layout settings or use defaults
  const [layoutOptions, setLayoutOptions] = useState<LayoutOptions>(() => {
    const saved = loadLayoutSettings();
    return saved || getDefaultLayoutOptions();
  });

  // Force re-layout when options change
  const [forceLayoutKey, setForceLayoutKey] = useState<number>(0);

  const handleLayoutChange = useCallback((newOptions: LayoutOptions) => {
    console.log('🔍 [Layout] Options changed:', newOptions);
    setLayoutOptions(newOptions);
    saveLayoutSettings(newOptions);
    // Force immediate re-layout
    setForceLayoutKey((prev) => prev + 1);
  }, []);

  // Use a key to force remount when nodes/edges change
  const machineKey = useRef<number>(0);
  useEffect(() => {
    machineKey.current += 1;
  }, [initialNodes, initialEdges]);

  const reactFlowInstanceRef = useRef<any>(null);

  const { nodes, onNodesChange, isInitialized, isLayoutComplete } =
    useStateMachineNodes(
      initialNodes,
      value,
      previousState,
      machineKey.current,
      layoutOptions,
      forceLayoutKey
    );

  // Fit view when layout is complete
  useEffect(() => {
    if (isLayoutComplete && reactFlowInstanceRef.current) {
      setTimeout(() => {
        reactFlowInstanceRef.current?.fitView({
          padding: 0.3,
          includeHiddenNodes: false,
          duration: 800, // Animate the zoom/pan over 800ms
        });
      }, 50); // Small delay to ensure nodes are properly positioned
    }
  }, [isLayoutComplete]);

  const { edges, onEdgesChange, updateEdges } = useStateMachineEdges(
    initialEdges,
    nodes,
    value,
    previousState,
    interactive
  );

  // Update edges when nodes change (positions or states)
  useEffect(() => {
    if (isInitialized && nodes.length > 0) {
      updateEdges();
    }
  }, [nodes, updateEdges, isInitialized]);

  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: any) => {
      event.stopPropagation();
      const eventType = edge.data?.event;
      const isClickable = edge.data?.isClickable;
      if (eventType && isClickable) {
        dispatch({ type: eventType });
      }
    },
    [dispatch]
  );

  return (
    <>
      <div className="w-full h-full border border-gray-200 dark:border-gray-700 rounded relative overflow-hidden">
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
              type: "custom",
              markerEnd: { type: MarkerType.ArrowClosed },
            }}
            fitView
            fitViewOptions={{ padding: 0.2, includeHiddenNodes: true, minZoom: 0.5, maxZoom: 2 }}
          >
            <Controls
              showZoom={true}
              showFitView={true}
              showInteractive={false}
              position="bottom-right"
            />
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
            />

            {/* Layout Options Button */}
            <Panel position="top-right">
              <button
                onClick={() => {
                  console.log('🔍 [Portal] Layout button clicked, showLayoutDialog:', showLayoutDialog);
                  setShowLayoutDialog(!showLayoutDialog);
                }}
                className="bg-white dark:bg-gray-800 p-2 rounded-md shadow-md border border-gray-200 dark:border-gray-700 flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
                Layout
              </button>
            </Panel>
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {showLayoutDialog &&
        (() => {
          console.log('🔍 [Portal] Rendering portal to document.body');
          return createPortal(
            <div
              className="fixed inset-0 z-50 flex items-start justify-end"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
              onClick={(e) => {
                console.log('🔍 [Portal] Backdrop clicked');
                if (e.target === e.currentTarget) setShowLayoutDialog(false);
              }}
            >
              <div className="mt-16 mr-4 max-w-[300px] overflow-auto">
                <LayoutPanel
                  options={layoutOptions}
                  onOptionsChange={handleLayoutChange}
                />
              </div>
            </div>,
            document.body
          );
        })()}
    </>
  );
};

export default ReactFlowInspector;
