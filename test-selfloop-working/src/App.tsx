import React, { useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Background,
  Position,
  ConnectionMode,
  MarkerType,
  type OnConnect,
  type Node,
  type Edge,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import ButtonEdge from './ButtonEdge';
import SelfConnectingEdge from './SelfConnectingEdge';
import BiDirectionalEdge from './BiDirectionalEdge';
import BiDirectionalNode from './BiDirectionalNode';

// State Machine: Traffic Light with Manual Override
const initialNodes: Node[] = [
  // Main states
  {
    id: 'idle',
    data: { label: 'Idle' },
    position: { x: 0, y: 0 },
    type: 'bidirectional',
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: 'running',
    data: { label: 'Running' },
    position: { x: 300, y: 0 },
    type: 'bidirectional',
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: 'paused',
    data: { label: 'Paused' },
    position: { x: 150, y: 150 },
    type: 'bidirectional',
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
];

const initialEdges: Edge[] = [
  // Idle <-> Running (bidirectional)
  {
    id: 'idle-to-running',
    source: 'idle',
    target: 'running',
    type: 'bidirectional',
    sourceHandle: 'right',
    targetHandle: 'left',
    label: 'START',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  {
    id: 'running-to-idle',
    source: 'running',
    target: 'idle',
    type: 'bidirectional',
    sourceHandle: 'left',
    targetHandle: 'right',
    label: 'STOP',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  // Running <-> Paused (bidirectional)
  {
    id: 'running-to-paused',
    source: 'running',
    target: 'paused',
    type: 'bidirectional',
    sourceHandle: 'left',
    targetHandle: 'right',
    label: 'PAUSE',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  {
    id: 'paused-to-running',
    source: 'paused',
    target: 'running',
    type: 'bidirectional',
    sourceHandle: 'right',
    targetHandle: 'left',
    label: 'RESUME',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  // Multiple parallel edges: Idle -> Paused (3 different ways)
  {
    id: 'idle-to-paused-direct',
    source: 'idle',
    target: 'paused',
    type: 'bidirectional',
    sourceHandle: 'right',
    targetHandle: 'left',
    label: 'DIRECT',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  {
    id: 'paused-to-idle-direct',
    source: 'paused',
    target: 'idle',
    type: 'bidirectional',
    sourceHandle: 'left',
    targetHandle: 'right',
    label: 'RETURN',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  {
    id: 'idle-to-paused-via-running',
    source: 'idle',
    target: 'paused',
    type: 'bidirectional',
    sourceHandle: 'right',
    targetHandle: 'left',
    label: 'VIA_RUN',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  {
    id: 'paused-to-idle-via-running',
    source: 'paused',
    target: 'idle',
    type: 'bidirectional',
    sourceHandle: 'left',
    targetHandle: 'right',
    label: 'VIA_RUN',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  // Self-loop on Running (TICK event)
  {
    id: 'running-tick',
    source: 'running',
    target: 'running',
    type: 'selfconnecting',
    label: 'TICK',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  // Self-loop on Paused (HEARTBEAT)
  {
    id: 'paused-heartbeat',
    source: 'paused',
    target: 'paused',
    type: 'selfconnecting',
    label: 'HEARTBEAT',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
];

const edgeTypes = {
  bidirectional: BiDirectionalEdge,
  selfconnecting: SelfConnectingEdge,
  buttonedge: ButtonEdge,
};

const nodeTypes = {
  bidirectional: BiDirectionalNode,
};

const EdgesFlow = () => {
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
      nodeTypes={nodeTypes}
      fitView
      attributionPosition="top-right"
      connectionMode={ConnectionMode.Loose}
    >
      <Controls />
      <Background />
    </ReactFlow>
  );
};

export default EdgesFlow;
