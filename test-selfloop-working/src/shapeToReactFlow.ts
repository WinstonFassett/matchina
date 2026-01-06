import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import type { MachineShape } from '../../src/hsm/shape-types';
import { createCounterMachine } from '../../docs/src/code/examples/counter/machine';
import { createToggleMachine } from '../../docs/src/code/examples/toggle/machine';

// Simple state machine shape interface
interface StateMachineShape {
  states: Record<string, { on?: Record<string, string> }>;
  transitions: Record<string, Record<string, string>>;
  initial: string;
}

// Extract shape from matchina machine using proper shape API
function extractShape(machine: { shape?: { getState(): MachineShape } }): StateMachineShape {
  const machineShape = machine.shape?.getState();
  console.log('DEBUG: MachineShape:', machineShape);
  
  if (!machineShape) {
    console.error('DEBUG: No shape found on machine');
    return {
      states: {},
      transitions: {},
      initial: 'initial'
    };
  }

  const shape: StateMachineShape = {
    states: {},
    transitions: {},
    initial: machineShape.initialKey
  };

  // Extract states from MachineShape
  machineShape.states.forEach((stateNode, fullKey) => {
    console.log(`DEBUG: Processing state ${fullKey}:`, stateNode);
    shape.states[fullKey] = {}; // StateNode doesn't have 'on', transitions are separate
  });

  // Extract transitions from MachineShape
  machineShape.transitions.forEach((transitions, fromState) => {
    console.log(`DEBUG: Found transitions for ${fromState}:`, transitions);
    shape.transitions[fromState] = {};
    transitions.forEach((toState, event) => {
      shape.transitions[fromState][event] = toState;
    });
  });

  console.log('DEBUG: Final extracted shape:', shape);
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
  console.log('DEBUG: Creating edges from transitions:', shape.transitions);
  Object.entries(shape.transitions).forEach(([fromState, transitions]) => {
    console.log(`DEBUG: Processing transitions from ${fromState}:`, transitions);
    Object.entries(transitions).forEach(([event, toState]) => {
      // Handle special syntax like '^Inactive' (exit to parent)
      let targetState = toState;
      if (toState.startsWith('^')) {
        targetState = toState.substring(1);
      }

      const edge = {
        id: `${fromState}-${toState}-${event}`,
        source: fromState,
        target: targetState,
        sourceHandle: null,
        targetHandle: null,
        label: event,
        type: 'floating', // Use our floating edge type
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
        data: {
          event,
          isSelfTransition: fromState === toState,
        },
      };
      
      console.log('DEBUG: Creating edge:', edge);
      edges.push(edge);
    });
  });

  console.log('DEBUG: Final result - nodes:', nodes.length, 'edges:', edges.length);
  console.log('DEBUG: Final edges:', edges);
  return { nodes, edges };
}

// Test machines for dynamic loading
export const testMachines = {
  counter: () => {
    console.log('DEBUG: Creating counter machine...');
    const machine = createCounterMachine();
    console.log('DEBUG: Counter machine created:', machine);
    console.log('DEBUG: Counter machine.shape:', machine.shape);
    return extractShape(machine);
  },
  toggle: () => {
    console.log('DEBUG: Creating toggle machine...');
    const machine = createToggleMachine();
    console.log('DEBUG: Toggle machine created:', machine);
    console.log('DEBUG: Toggle machine.shape:', machine.shape);
    return extractShape(machine);
  },
};

// Example usage
export function createDynamicTest(machineName: keyof typeof testMachines) {
  const machine = testMachines[machineName]();
  return shapeToReactFlow(machine);
}
