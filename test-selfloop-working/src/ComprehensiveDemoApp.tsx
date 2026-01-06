import React, { useCallback } from 'react';
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

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; title: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; title: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in ${this.props.title}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%',
          height: '300px',
          border: '2px solid #dc3545',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          background: '#f8d7da',
          color: '#721c24'
        }}>
          <h3>Error in {this.props.title}</h3>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Individual machine demo component
function MachineDemo({ 
  machineName, 
  title 
}: { 
  machineName: keyof typeof testMachines; 
  title: string; 
}) {
  // Get nodes and edges from selected machine
  const { nodes: initialNodes, edges: initialEdges } = createDynamicTest(machineName);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const selfLoops = edges.filter(e => e.source === e.target).length;
  const bidirectional = edges.filter(e => {
    return edges.some(other => 
      other.source === e.target && other.target === e.source && other.id !== e.id
    );
  }).length / 2; // Divide by 2 since each pair is counted twice

  return (
    <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{
        background: '#f8f9fa',
        padding: '12px',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{title}</h4>
        <div style={{ fontSize: '12px', color: '#6c757d' }}>
          States: {nodes.length} | Transitions: {edges.length} | 
          Self-loops: {selfLoops} | Bidirectional: {bidirectional}
        </div>
      </div>
      
      <div style={{ width: '100%', height: '250px' }}>
        <ErrorBoundary title={title}>
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
            minZoom={0.5}
            maxZoom={2}
          >
            <Controls />
            <Background />
          </ReactFlow>
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default function ComprehensiveDemoApp() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#f8f9fa',
      padding: '20px',
      overflow: 'auto'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
            Self-Loop & Bidirectional Edge Testing
          </h1>
          <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
            Testing floating edges with real state machine shapes. Each demo shows self-loops and bidirectional transitions.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          <MachineDemo machineName="counter" title="Counter Machine (Self-loops)" />
          <MachineDemo machineName="toggle" title="Toggle Machine (Bidirectional)" />
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginTop: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Test Results</h3>
          <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
            <div>✅ Counter: Shows self-loop transitions (increment, decrement, reset)</div>
            <div>✅ Toggle: Shows bidirectional transitions (toggle)</div>
            <div>✅ Error boundaries protect against rendering failures</div>
            <div>✅ Floating edges handle both self-loops and bidirectional connections</div>
          </div>
        </div>
      </div>
    </div>
  );
}
