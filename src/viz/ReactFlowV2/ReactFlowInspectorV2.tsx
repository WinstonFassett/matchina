import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import FloatingEdge from './FloatingEdge';
import SimpleNode from './SimpleNode';
import GroupNode from './GroupNode';

interface NodeData extends Record<string, unknown> {
  label: string;
  isActive?: boolean;
  isPrevious?: boolean;
  isCompound?: boolean;
}

interface EdgeData extends Record<string, unknown> {
  event?: string;
  isClickable?: boolean;
  isActive?: boolean;
}

export interface ReactFlowInspectorV2Props {
  value: string; // Current active state
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
  previousState?: string;
  dispatch?: (event: { type: string }) => void;
  interactive?: boolean;
}

const nodeTypes: NodeTypes = {
  simple: SimpleNode as any,
  group: GroupNode as any,
};

const edgeTypes: EdgeTypes = {
  floating: FloatingEdge as any,
};

/**
 * Inner component that has access to ReactFlow instance
 */
function ReactFlowInspectorInner({
  value,
  nodes: initialNodes,
  edges: initialEdges,
  previousState,
  dispatch,
  interactive = true,
}: ReactFlowInspectorV2Props) {
  const { fitView } = useReactFlow();
  const isFirstRender = useRef(true);

  // Separate layout nodes (stable) from highlighting (dynamic)
  const layoutNodes = useMemo(() => {
    return initialNodes.map((node) => ({
      ...node,
      type: node.type || 'simple',
      data: {
        ...node.data,
        // Don't include highlighting in layout nodes
      },
    }));
  }, [initialNodes]);

  // Process edges with active state highlighting and clickability (V1 parity)
  const processedEdges = useMemo(() => {
    return initialEdges.map((edge) => {
      // V1 logic: Three types of edge highlighting
      const isTransitionFromPrevious = edge.source === previousState && edge.target === value;
      const isPossibleExit = edge.source === value; // Current state to any target
      const isClickable = interactive && isPossibleExit;

      // Determine edge style based on V1 priority system
      let strokeColor = '#94a3b8'; // Default inactive (gray)
      let strokeWidth = 2;
      let strokeDasharray = undefined;
      let opacity = 0.8;
      
      if (isTransitionFromPrevious) {
        // Previous → Current: animated dashed blue (highest priority)
        strokeColor = '#60a5fa';
        strokeWidth = 3;
        strokeDasharray = '5,5';
        opacity = 1;
      } else if (isPossibleExit) {
        // Current → Any: solid blue (medium priority)
        strokeColor = '#2563eb';
        strokeWidth = 2.5;
        opacity = 0.9;
      }

      return {
        ...edge,
        type: 'floating', // Use our floating edge for all edges
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: strokeColor,
        },
        style: {
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
          opacity,
          cursor: isClickable ? 'pointer' : 'default',
        },
        labelStyle: {
          fontSize: '10px',
          fill: strokeColor,
          fontWeight: 500,
        },
        data: {
          ...edge.data,
          isActive: isPossibleExit, // For compatibility with existing logic
          isClickable,
          isTransitionFromPrevious, // New: for V1-style highlighting
        },
        // Add data attributes for CSS targeting
        'data-is-clickable': isClickable ? 'true' : 'false',
        'data-is-transition-from-previous': isTransitionFromPrevious ? 'true' : 'false',
      };
    });
  }, [initialEdges, value, previousState, interactive]);

  // Initialize with layout nodes (stable)
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(processedEdges);

  // Update nodes when layout changes (initial nodes change)
  useEffect(() => {
    // Add layout key to force ReactFlow to re-render when positions change
    const nodesWithKeys = layoutNodes.map(node => ({
      ...node,
      key: `${node.id}-${node.position.x}-${node.position.y}` // Force re-render on position change
    }));
    
    setNodes(nodesWithKeys);
  }, [layoutNodes, setNodes]);

  // Update highlighting without recreating node objects
  useEffect(() => {
    // Update only the data properties, preserve positions and references
    setNodes(currentNodes => 
      currentNodes.map(node => ({
        ...node,
        // CRITICAL: Preserve position from current node (layout changes)
        position: node.position,
        data: {
          ...node.data,
          isActive: node.id === value,
          isPrevious: node.id === previousState,
        },
      }))
    );
  }, [value, previousState, setNodes]);

  // Update edges when processed edges change
  useEffect(() => {
    setEdges(processedEdges);
  }, [processedEdges, setEdges]);

  // Fit view on first render and when layout changes (not when highlighting changes)
  // Create a stable key based on node positions, not highlighting state
  const layoutKey = useMemo(() => {
    return layoutNodes
      .map(n => `${n.id}:${n.position.x}:${n.position.y}`)
      .sort()
      .join('|');
  }, [layoutNodes]);

  // Fit view on first render and when layout changes (not when highlighting changes)
  useEffect(() => {
    if (layoutNodes.length > 0) {
      // Small delay to allow layout to settle
      const duration = isFirstRender.current ? 500 : 300;
      isFirstRender.current = false;
      setTimeout(() => {
        fitView({ padding: 0.2, duration });
      }, 100);
    }
  }, [layoutKey, layoutNodes.length, fitView]);

  // Handle edge click for triggering transitions
  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge<EdgeData & Record<string, unknown>>) => {
      if (!dispatch) return;
      const eventType = edge.data?.event || (edge.label as string);
      const isClickable = edge.data?.isClickable;
      if (eventType && isClickable) {
        dispatch({ type: eventType });
      }
    },
    [dispatch]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onEdgeClick={handleEdgeClick}
      defaultEdgeOptions={{
        type: 'floating',
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
      }}
      // Remove fitView to prevent auto-fit on node updates
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

/**
 * ReactFlowInspectorV2 - Improved visualizer using @xyflow/react
 *
 * Features:
 * - Circular self-loops that don't overlap
 * - Bidirectional edge spacing
 * - Clean node and edge styling
 * - Active state highlighting
 */
export default function ReactFlowInspectorV2(props: ReactFlowInspectorV2Props) {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 400 }}>
      <ReactFlowInspectorInner {...props} />
    </div>
  );
}
