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

// State Machine with floating edges - COMPREHENSIVE stacking test
const initialNodes: Node[] = [
  {
    id: 'idle',
    data: { label: 'Idle' },
    position: { x: 100, y: 100 },
  },
  {
    id: 'running',
    data: { label: 'Running' },
    position: { x: 400, y: 100 },
  },
  {
    id: 'paused',
    data: { label: 'Paused' },
    position: { x: 250, y: 250 },
  },
  {
    id: 'error',
    data: { label: 'Error' },
    position: { x: 550, y: 250 },
  },
];

const initialEdges: Edge[] = [
  // COMPREHENSIVE STACKING TEST
  
  // 1. MULTIPLE SELF-CONNECTIONS - Running (4 self-loops to test stacking)
  {
    id: 'running-self-1',
    source: 'running',
    target: 'running',
    type: 'floating',
    label: 'TICK',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  {
    id: 'running-self-2',
    source: 'running',
    target: 'running',
    type: 'floating',
    label: 'TIMEOUT',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  {
    id: 'running-self-3',
    source: 'running',
    target: 'running',
    type: 'floating',
    label: 'ERROR_CHECK',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  {
    id: 'running-self-4',
    source: 'running',
    target: 'running',
    type: 'floating',
    label: 'HEARTBEAT',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  
  // 2. MULTIPLE SELF-CONNECTIONS - Error (3 self-loops to test stacking)
  {
    id: 'error-self-1',
    source: 'error',
    target: 'error',
    type: 'floating',
    label: 'RETRY_DELAY',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  {
    id: 'error-self-2',
    source: 'error',
    target: 'error',
    type: 'floating',
    label: 'LOG_ERROR',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  {
    id: 'error-self-3',
    source: 'error',
    target: 'error',
    type: 'floating',
    label: 'CLEANUP',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  
  // 3. MULTIPLE BIDIRECTIONAL - Idle <-> Running (3 pairs = 6 edges)
  {
    id: 'idle-to-running-1',
    source: 'idle',
    target: 'running',
    type: 'floating',
    label: 'START_1',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  {
    id: 'running-to-idle-1',
    source: 'running',
    target: 'idle',
    type: 'floating',
    label: 'STOP_1',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  {
    id: 'idle-to-running-2',
    source: 'idle',
    target: 'running',
    type: 'floating',
    label: 'START_2',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  {
    id: 'running-to-idle-2',
    source: 'running',
    target: 'idle',
    type: 'floating',
    label: 'STOP_2',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  {
    id: 'idle-to-running-3',
    source: 'idle',
    target: 'running',
    type: 'floating',
    label: 'START_3',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  {
    id: 'running-to-idle-3',
    source: 'running',
    target: 'idle',
    type: 'floating',
    label: 'STOP_3',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  
  // 4. SINGLE BIDIRECTIONAL - Running <-> Error (1 pair = 2 edges)
  {
    id: 'running-to-error',
    source: 'running',
    target: 'error',
    type: 'floating',
    label: 'FAIL',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  {
    id: 'error-to-running',
    source: 'error',
    target: 'running',
    type: 'floating',
    label: 'RETRY',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  // Multiple self-loops on Paused
  {
    id: 'paused-heartbeat',
    source: 'paused',
    target: 'paused',
    type: 'floating',
    label: 'HEARTBEAT',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  {
    id: 'paused-resume',
    source: 'paused',
    target: 'paused',
    type: 'floating',
    label: 'AUTO_RESUME',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
  },
  {
    id: 'paused-cleanup',
    source: 'paused',
    target: 'paused',
    type: 'floating',
    label: 'CLEANUP',
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
