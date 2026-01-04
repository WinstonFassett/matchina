import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import type { EdgeTypes, NodeTypes, Node, Edge } from "reactflow";

// Custom node data structure
export interface CustomNodeData {
  label: string;
  isActive: boolean;
  isPrevious: boolean;
}

// Custom node type that extends reactflow Node with our data
export type CustomNode = Node<CustomNodeData>;
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
import CustomNodeComponent from "./CustomNode";
import GroupNode from "./GroupNode";
import LayoutPanel from "./LayoutPanel";
import { useStateMachineEdges } from "./hooks/useStateMachineEdges";
import { useStateMachineNodes } from "./hooks/useStateMachineNodes";
import type { LayoutOptions } from "./utils/elkLayout";
import { getDefaultLayoutOptions } from "./utils/elkLayout";
import { loadLayoutSettings, saveLayoutSettings } from "./utils/layoutStorage";
import { getReactFlowPreset, applyReactFlowPreset } from "./presets";

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
  nodes: CustomNode[];
  edges: Edge[];
  previousState?: string;
  dispatch: (event: { type: string }) => void;
  layoutOptions?: LayoutOptions;
  interactive?: boolean; // Controls whether edges can be clicked to trigger transitions
  exampleName?: string; // For example-specific optimizations
  zoomBehavior?: 'none' | 'center-on-active' | 'fit-on-active'; // How to handle zoom on state changes
}

const nodeTypes: NodeTypes = {
  custom: CustomNodeComponent as any, // Type assertion to avoid complex generic issues
  group: GroupNode as any,
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
  layoutOptions: initialLayoutOptions,
  interactive = true,
  exampleName,
  zoomBehavior = 'center-on-active',
}) => {
  const [showLayoutDialog, setShowLayoutDialog] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<{ x: number; y: number } | null>(null);
  const layoutButtonRef = useRef<HTMLButtonElement>(null);

  // Load saved layout settings or use example-specific preset, allowing prop override
  const [layoutOptions, setLayoutOptions] = useState<LayoutOptions>(() => {
    if (initialLayoutOptions) return initialLayoutOptions;
    
    // Try example-specific preset first
    if (exampleName) {
      const preset = getReactFlowPreset(exampleName);
      return { ...getDefaultLayoutOptions(), ...preset.layoutOptions };
    }
    
    // Fallback to saved settings or defaults
    const saved = loadLayoutSettings();
    return saved || getDefaultLayoutOptions();
  });

  // Force re-layout when options change
  const [forceLayoutKey, setForceLayoutKey] = useState<number>(0);

  const handleLayoutButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (layoutButtonRef.current) {
      const rect = layoutButtonRef.current.getBoundingClientRect();
      console.log('🔍 [Layout] Button clicked, position:', { x: rect.x, y: rect.y, width: rect.width, height: rect.height });
      
      // Position popover below and slightly left of button
      // Ensure popover stays within viewport bounds
      const popoverWidth = 300;
      const popoverX = Math.min(rect.x - popoverWidth + rect.width + 8, window.innerWidth - popoverWidth - 16);
      const popoverY = rect.y + rect.height + 4;
      
      setButtonPosition({
        x: Math.max(16, popoverX), // Ensure at least 16px from left edge
        y: popoverY
      });
    }
    
    setShowLayoutDialog(!showLayoutDialog);
  }, [showLayoutDialog]);

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

  // Convert edges to transitions for ELK layout
  const transitions = useMemo(() => {
    return initialEdges.map((edge) => ({
      from: edge.source,
      to: edge.target,
      event: (edge.label as string) || "",
    }));
  }, [initialEdges]);

  const { nodes, onNodesChange, isInitialized, isLayoutComplete } =
    useStateMachineNodes(
      initialNodes,
      value,
      previousState,
      machineKey.current,
      layoutOptions,
      forceLayoutKey,
      transitions
    );

  // Fit view when layout is complete
  useEffect(() => {
    if (isLayoutComplete && reactFlowInstanceRef.current) {
      // Get example-specific fitView options
      const preset = exampleName ? getReactFlowPreset(exampleName) : null;
      const fitViewOptions = preset?.fitViewOptions || {
        padding: 0.3,
        minZoom: 0.01,
        maxZoom: 3,
        duration: 1200,
      };
      
      setTimeout(() => {
        reactFlowInstanceRef.current?.fitView(fitViewOptions);
      }, 200);
    }
  }, [isLayoutComplete, exampleName]);

  // Handle zoom behavior when active state changes
  useEffect(() => {
    if (!reactFlowInstanceRef.current || !isInitialized || !value || zoomBehavior === 'none') return;

    const activeNode = nodes.find((node) => node.id === value);
    if (!activeNode) return;

    if (zoomBehavior === 'center-on-active') {
      // Center on active node without changing zoom level
      reactFlowInstanceRef.current.setCenter(
        activeNode.position.x + (activeNode.width || 120) / 2,
        activeNode.position.y + (activeNode.height || 80) / 2,
        { duration: 500 }
      );
    } else if (zoomBehavior === 'fit-on-active') {
      // Fit to active node with extreme zoom limits
      reactFlowInstanceRef.current.fitBounds(
        {
          x: activeNode.position.x,
          y: activeNode.position.y,
          width: activeNode.width || 120,
          height: activeNode.height || 80,
        },
        {
          padding: 0.4,
          duration: 500,
          // No zoom constraints - let global limits handle it
        }
      );
    }
  }, [value, nodes, isInitialized, zoomBehavior]);

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
      <div className="w-full h-full border border-gray-200 dark:border-gray-700 rounded relative" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
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
            minZoom={0.001}  // Extreme zoom out for huge diagrams
            maxZoom={10}      // Extreme zoom in for detailed inspection
            fitView
            fitViewOptions={{ padding: 0.3, includeHiddenNodes: true }}
            style={{ width: '100%', flex: 1 }}
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
                ref={layoutButtonRef}
                onClick={handleLayoutButtonClick}
                className="bg-white dark:bg-gray-800 p-2 rounded-md shadow-md border border-gray-200 dark:border-gray-700 flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                title="Layout Options"
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

      {showLayoutDialog && buttonPosition &&
        (() => {
          console.log('🔍 [Portal] Rendering portal to document.body at position:', buttonPosition);
          return createPortal(
            <div
              className="fixed inset-0 z-50"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
              onClick={(e) => {
                console.log('🔍 [Portal] Backdrop clicked');
                if (e.target === e.currentTarget) setShowLayoutDialog(false);
              }}
            >
              <div
                className="relative"
                style={{
                  position: 'fixed',
                  left: `${buttonPosition.x}px`,
                  top: `${buttonPosition.y}px`,
                  maxWidth: '300px',
                  maxHeight: '80vh',
                  overflow: 'auto'
                }}
              >
                <button
                  onClick={() => setShowLayoutDialog(false)}
                  className="absolute top-2 right-2 z-10 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
                  title="Close"
                  style={{ minWidth: '24px', minHeight: '24px' }}
                >
                  ✕
                </button>
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
