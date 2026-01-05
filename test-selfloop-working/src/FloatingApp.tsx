import React, { useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Background,
  MarkerType,
  type OnConnect,
  type Node,
  type Edge,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import './floating-edges.css';

import FloatingEdge from './FloatingEdge';
import SimpleNode from './SimpleNode';
import FloatingConnectionLine from './FloatingConnectionLine';

// State Machine with floating edges (using default nodes)
const initialNodes: Node[] = [
  {
    id: 'idle',
    data: { label: 'Idle' },
    position: { x: 0, y: 0 },
  },
  {
    id: 'running',
    data: { label: 'Running' },
    position: { x: 300, y: 0 },
  },
  {
    id: 'paused',
    data: { label: 'Paused' },
    position: { x: 150, y: 150 },
  },
];

const initialEdges: Edge[] = [
  // Idle -> Running
  {
    id: 'idle-to-running',
    source: 'idle',
    target: 'running',
    type: 'floating',
    label: 'START',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  // Running -> Idle
  {
    id: 'running-to-idle',
    source: 'running',
    target: 'idle',
    type: 'floating',
    label: 'STOP',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  // Running -> Paused
  {
    id: 'running-to-paused',
    source: 'running',
    target: 'paused',
    type: 'floating',
    label: 'PAUSE',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  // Paused -> Running
  {
    id: 'paused-to-running',
    source: 'paused',
    target: 'running',
    type: 'floating',
    label: 'RESUME',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  // Multiple parallel edges: Idle <-> Paused
  {
    id: 'idle-to-paused-1',
    source: 'idle',
    target: 'paused',
    type: 'floating',
    label: 'DIRECT',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  {
    id: 'paused-to-idle-1',
    source: 'paused',
    target: 'idle',
    type: 'floating',
    label: 'RETURN',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  {
    id: 'idle-to-paused-2',
    source: 'idle',
    target: 'paused',
    type: 'floating',
    label: 'VIA_RUN',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  {
    id: 'paused-to-idle-2',
    source: 'paused',
    target: 'idle',
    type: 'floating',
    label: 'VIA_RUN',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  // Self-loop on Running
  {
    id: 'running-tick',
    source: 'running',
    target: 'running',
    type: 'floating',
    label: 'TICK',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  // Self-loop on Paused
  {
    id: 'paused-heartbeat',
    source: 'paused',
    target: 'paused',
    type: 'floating',
    label: 'HEARTBEAT',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
];

const edgeTypes = {
  floating: FloatingEdge,
};


const FloatingEdgesFlow = () => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      edgeTypes={edgeTypes}
      fitView
      attributionPosition="top-right"
      connectionLineComponent={FloatingConnectionLine}
    >
      <Controls />
      <Background />
    </ReactFlow>
  );
};

export default FloatingEdgesFlow;
