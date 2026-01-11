import { useCallback } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [
  {
    id: 'A',
    type: 'group',
    data: { label: 'Group A' },
    position: { x: 0, y: 0 },
    style: { width: 170, height: 140 },
  },
  {
    id: 'A-1',
    data: { label: 'Node A.1' },
    position: { x: 10, y: 50 },
    parentId: 'A',
  },
  {
    id: 'B',
    type: 'group',
    data: { label: 'Group B' },
    position: { x: 250, y: 0 },
    style: { width: 300, height: 300 },
  },
  {
    id: 'B-1',
    data: { label: 'Node B.1' },
    position: { x: 20, y: 50 },
    parentId: 'B',
    extent: 'parent',
  },
  {
    id: 'B-A',
    type: 'group',
    data: { label: 'Group B.A' },
    position: { x: 20, y: 120 },
    style: { width: 260, height: 160 },
    parentId: 'B',
  },
  {
    id: 'B-A-1',
    data: { label: 'Node B.A.1' },
    position: { x: 10, y: 50 },
    parentId: 'B-A',
  },
  {
    id: 'B-A-2',
    data: { label: 'Node B.A.2' },
    position: { x: 140, y: 50 },
    parentId: 'B-A',
  },
];

const initialEdges: Edge[] = [
  { id: 'a1-b1', source: 'A-1', target: 'B-1' },
  { id: 'ba1-ba2', source: 'B-A-1', target: 'B-A-2' },
];

export default function ExactReactFlowSubflow() {
  const [nodes, _setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100%', height: 400, background: '#1a1a2e' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
