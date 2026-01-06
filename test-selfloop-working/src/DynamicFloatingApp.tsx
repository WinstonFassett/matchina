import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Background,
  type OnConnect,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import './floating-edges.css';

import FloatingEdge from './FloatingEdge';
import SimpleNode from './SimpleNode';
import FloatingConnectionLine from './FloatingConnectionLine';
import { createDynamicTest, testMachines } from './shapeToReactFlow';

// Define node and edge types for ReactFlow
const nodeTypes = {
  default: SimpleNode,
};

const edgeTypes = {
  floating: FloatingEdge,
};

// Machine selector component
function MachineSelector({ selectedMachine, onSelect }: {
  selectedMachine: keyof typeof testMachines;
  onSelect: (machine: keyof typeof testMachines) => void;
}) {
  return (
    <div style={{ 
      position: 'absolute', 
      top: 10, 
      left: 10, 
      zIndex: 1000,
      background: 'white',
      padding: '10px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Test Machine:</h4>
      <select 
        value={selectedMachine} 
        onChange={(e) => onSelect(e.target.value as keyof typeof testMachines)}
        style={{ padding: '4px 8px', fontSize: '12px' }}
      >
        <option value="counter">Counter (Self-loops)</option>
        <option value="toggle">Toggle (Bidirectional)</option>
      </select>
    </div>
  );
}

export default function DynamicFloatingApp() {
  const [selectedMachine, setSelectedMachine] = useState<keyof typeof testMachines>('counter');
  
  // Get nodes and edges from selected machine
  const { nodes: initialNodes, edges: initialEdges } = createDynamicTest(selectedMachine);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Switch machines
  const handleMachineSelect = useCallback((machineName: keyof typeof testMachines) => {
    setSelectedMachine(machineName);
    const { nodes: newNodes, edges: newEdges } = createDynamicTest(machineName);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <MachineSelector 
        selectedMachine={selectedMachine} 
        onSelect={handleMachineSelect} 
      />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineComponent={FloatingConnectionLine}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
      
      <div style={{ 
        position: 'absolute', 
        bottom: 10, 
        right: 10, 
        background: 'white', 
        padding: '8px', 
        borderRadius: '4px',
        fontSize: '12px',
        opacity: 0.8
      }}>
        <div>Machine: {selectedMachine}</div>
        <div>States: {nodes.length}</div>
        <div>Transitions: {edges.length}</div>
        <div>Self-loops: {edges.filter(e => e.source === e.target).length}</div>
      </div>
    </div>
  );
}
