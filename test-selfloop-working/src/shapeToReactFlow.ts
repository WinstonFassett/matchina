import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import { createCounterMachine } from '../../docs/src/code/examples/counter/machine';
import { createToggleMachine } from '../../docs/src/code/examples/toggle/machine';

// Simple state machine shape interface
interface StateMachineShape {
  states: Record<string, { on?: Record<string, string> }>;
  transitions: Record<string, Record<string, string>>;
  initial: string;
}

// Extract shape from matchina machine
function extractShape(machine: { states?: Record<string, unknown>; initial?: string }): StateMachineShape {
  const shape: StateMachineShape = {
    states: {},
    transitions: {},
    initial: machine.initial || 'initial'
  };

  // Extract states and transitions
  Object.entries(machine.states || {}).forEach(([stateName, stateConfig]) => {
    const config = stateConfig as { on?: Record<string, string> };
    shape.states[stateName] = config;
    
    if (config.on) {
      shape.transitions[stateName] = config.on;
    }
  });

  return shape;
}

// Convert shape to ReactFlow nodes and edges
export function shapeToReactFlow(shape: StateMachineShape): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const stateNames = Object.keys(shape.states);
  
  // Simple layout - arrange states in a grid
  const cols = Math.ceil(Math.sqrt(stateNames.length));
  
  stateNames.forEach((stateName, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    nodes.push({
      id: stateName,
      data: { label: stateName },
      position: { 
        x: 100 + col * 200, 
        y: 100 + row * 150 
      },
    });
  });

  // Create edges from transitions
  Object.entries(shape.transitions).forEach(([fromState, transitions]) => {
    Object.entries(transitions).forEach(([event, toState]) => {
      // Handle special syntax like '^Inactive' (exit to parent)
      let targetState = toState;
      if (toState.startsWith('^')) {
        targetState = toState.substring(1);
      }

      edges.push({
        id: `${fromState}-${toState}-${event}`,
        source: fromState,
        target: targetState,
        label: event,
        type: 'floating', // Use our floating edge type
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
        data: {
          event,
          isSelfTransition: fromState === toState,
        },
      });
    });
  });

  return { nodes, edges };
}

// Test machines for dynamic loading
export const testMachines = {
  counter: () => extractShape(createCounterMachine()),
  toggle: () => extractShape(createToggleMachine()),
};

// Example usage
export function createDynamicTest(machineName: keyof typeof testMachines) {
  const machine = testMachines[machineName]();
  return shapeToReactFlow(machine);
}
