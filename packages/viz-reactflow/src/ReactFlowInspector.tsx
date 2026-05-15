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
import './ReactFlowInspector.css';

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
  isDashed?: boolean;
}

// Events that represent reverse/error/cancel paths — rendered as dashed edges
const DASHED_EVENT_PATTERN = /^(error|reject|cancel|back|retry|fail|reset|abort|undo|timeout)/i;

export interface ReactFlowInspectorProps {
  value: string; // Current active state
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
  previousState?: string;
  currentTransition?: string; // Add the exact transition type that was taken
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
  currentTransition,
  dispatch,
  interactive = true,
}: ReactFlowInspectorProps) {
  const { fitView } = useReactFlow();
  const isFirstRender = useRef(true);
  const [visible, setVisible] = useState(false);

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
      // FIXED: Use exact transition instead of all edges from previous to current
      // Only consider it an exact transition if it's not the initialization event
      // For hierarchical states, check if the edge source is a parent of the previous state
      // and edge target is a parent of the current state
      const isExactTransition = currentTransition && 
        currentTransition !== '__initialize' &&
        previousState &&
        (edge.source === previousState || previousState.startsWith(edge.source + '_')) && 
        (edge.target === value || value.startsWith(edge.target + '_')) && 
        (edge.data?.event === currentTransition || edge.label === currentTransition);
      
      const isPossibleExit = edge.source === value;
      const isClickable = interactive;
      const eventName = (edge.data?.event || edge.label) as string | undefined;
      const isDashed = !!(eventName && DASHED_EVENT_PATTERN.test(eventName));

      // Edge stroke colors — use CSS vars where possible
      let strokeColor = 'var(--matchina-viz-edge, rgba(100,116,139,0.5))';
      let strokeWidth = 1.5;
      let strokeDasharray: string | undefined = isDashed ? '6,4' : undefined;
      let opacity = 0.85;

      if (isExactTransition) {
        strokeColor = 'var(--matchina-viz-accent, #8fb9d6)';
        strokeWidth = 2.5;
        strokeDasharray = '5,5';
        opacity = 1;
      } else if (isPossibleExit) {
        strokeColor = 'var(--matchina-viz-accent, #8fb9d6)';
        strokeWidth = 2;
        opacity = 1;
      }

      return {
        ...edge,
        type: 'floating',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: strokeColor,
        },
        style: {
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
          opacity,
          cursor: isClickable ? 'pointer' : 'default',
        },
        data: {
          ...edge.data,
          isActive: isPossibleExit,
          isClickable,
          isExactTransition,
          isDashed,
        },
      };
    });
  }, [initialEdges, value, previousState, currentTransition, interactive]);

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

  // CRITICAL: Re-apply highlighting when nodes change (layout changes)
  // This ensures highlighting is preserved during layout transitions
  useEffect(() => {
    // When nodes change due to layout, re-apply highlighting
    setNodes(currentNodes => 
      currentNodes.map(node => ({
        ...node,
        // Preserve position from current node (layout changes)
        position: node.position,
        data: {
          ...node.data,
          isActive: node.id === value,
          isPrevious: node.id === previousState,
        },
      }))
    );
  }, [layoutNodes, value, previousState, setNodes]);

  // Fit view on first render and when layout changes (not when highlighting changes)
  // Create a stable key based on node positions, not highlighting state
  const layoutKey = useMemo(() => {
    return layoutNodes
      .map(n => `${n.id}:${n.position.x}:${n.position.y}`)
      .sort()
      .join('|');
  }, [layoutNodes]);

  useEffect(() => {
    if (layoutNodes.length > 0) {
      const first = isFirstRender.current;
      const duration = first ? 0 : 200;
      isFirstRender.current = false;
      setTimeout(() => {
        fitView({ padding: 0.1, duration });
        if (first) setVisible(true);
      }, 50);
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
      minZoom={0.1}
      maxZoom={1.0}
      defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      proOptions={{ hideAttribution: true }}
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 150ms ease' }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

/**
 * ReactFlowInspector - Improved visualizer using @xyflow/react
 *
 * Features:
 * - Circular self-loops that don't overlap
 * - Bidirectional edge spacing
 * - Clean node and edge styling
 * - Active state highlighting
 */
export default function ReactFlowInspector(props: ReactFlowInspectorProps) {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 400, display: 'flex' }}>
      <ReactFlowInspectorInner {...props} />
    </div>
  );
}
