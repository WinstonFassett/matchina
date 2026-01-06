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

import SelfConnectingEdge from './SelfConnectingEdge';

// Hardcoded state machine data - pure ReactFlow example
const initialNodes: Node[] = [
  {
    id: 'active',
    data: { label: 'Active' },
    position: { x: 125, y: 250 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: 'inactive',
    data: { label: 'Inactive' },
    position: { x: 125, y: 400 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
];

const initialEdges: Edge[] = [
  {
    id: 'self-loop-increment',
    source: 'active',
    target: 'active',
    type: 'selfconnecting',
    markerEnd: { type: MarkerType.Arrow },
    label: 'increment',
  },
  {
    id: 'self-loop-decrement',
    source: 'active',
    target: 'active',
    type: 'selfconnecting',
    markerEnd: { type: MarkerType.Arrow },
    label: 'decrement',
  },
  {
    id: 'self-loop-reset',
    source: 'active',
    target: 'active',
    type: 'selfconnecting',
    markerEnd: { type: MarkerType.Arrow },
    label: 'reset',
  },
  {
    id: 'active-to-inactive',
    source: 'active',
    target: 'inactive',
    markerEnd: { type: MarkerType.ArrowClosed },
    label: 'deactivate',
  },
  {
    id: 'inactive-to-active',
    source: 'inactive',
    target: 'active',
    markerEnd: { type: MarkerType.ArrowClosed },
    label: 'activate',
  },
];

const edgeTypes = {
  selfconnecting: SelfConnectingEdge,
};

export function TestVisualizer() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [],
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="top-right"
        connectionMode={ConnectionMode.Loose}
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
