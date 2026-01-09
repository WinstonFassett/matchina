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

  // Process nodes with active/previous state highlighting
  // Use useMemo to avoid recreating nodes unnecessarily
  const processedNodes = useMemo(() => {
    return initialNodes.map((node) => ({
      ...node,
      type: node.type || 'simple',
      data: {
        ...node.data,
        isActive: node.id === value,
        isPrevious: node.id === previousState,
      },
    }));
  }, [initialNodes, value, previousState]);

  // Process edges with active state highlighting and clickability
  const processedEdges = useMemo(() => {
    return initialEdges.map((edge) => {
      // An edge is active if it connects from the previous state to current state
      const isActive = edge.source === previousState && edge.target === value;
      // An edge is clickable if interactive AND it originates from current state
      const isClickable = interactive && edge.source === value;

      return {
        ...edge,
        type: 'floating', // Use our floating edge for all edges
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
        },
        data: {
          ...edge.data,
          isActive,
          isClickable,
        },
      };
    });
  }, [initialEdges, value, previousState, interactive]);

  // Initialize with processed nodes, but only update highlighting without recreating
  const [nodes, setNodes, onNodesChange] = useNodesState(processedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(processedEdges);

  // Update highlighting without recreating node objects
  useEffect(() => {
    console.log('🔄 Updating highlighting only:', {
      nodeCount: nodes.length,
      activeCount: nodes.filter(n => n.id === value).length
    });
    
    // Update only the data properties, preserve node references
    setNodes(currentNodes => 
      currentNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          isActive: node.id === value,
          isPrevious: node.id === previousState,
        },
      }))
    );
  }, [value, previousState, setNodes, nodes.length]);

  // Update edges when processed edges change
  useEffect(() => {
    console.log('🔄 Updating ReactFlow edges:', {
      edgeCount: processedEdges.length,
      activeEdges: processedEdges.filter(e => e.data.isActive).length
    });
    setEdges(processedEdges);
  }, [processedEdges, setEdges]);

  // Fit view on first render and when layout changes (not when highlighting changes)
  // Create a stable key based on node positions, not highlighting state
  const layoutKey = useMemo(() => {
    return processedNodes
      .map(n => `${n.id}:${n.position.x}:${n.position.y}`)
      .sort()
      .join('|');
  }, [processedNodes]);

  useEffect(() => {
    console.log('🎯 Fit view triggered:', {
      nodeCount: processedNodes.length,
      layoutKey: layoutKey.substring(0, 50) + '...',
      isFirstRender: isFirstRender.current
    });
    
    if (processedNodes.length > 0) {
      // Small delay to allow layout to settle
      const duration = isFirstRender.current ? 500 : 300;
      isFirstRender.current = false;
      setTimeout(() => {
        fitView({ padding: 0.2, duration });
      }, 100);
    }
  }, [layoutKey, processedNodes.length, fitView]);

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
