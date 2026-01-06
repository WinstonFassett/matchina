import React, { useMemo, useCallback } from 'react';
import { useMachine } from '../../integrations/react';
import type { TransitionEvent } from '../../state-machine';
import type { StateNode, MachineShape } from '../../hsm/shape-types';
import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import ReactFlowInspectorV2 from './ReactFlowInspectorV2';

interface HSMReactFlowInspectorV2Props {
  machine: {
    shape?: { getState(): MachineShape };
    send(event: string): void;
    notify: (ev: TransitionEvent) => void;
    getChange: () => TransitionEvent;
  };
  interactive?: boolean;
}

interface NodeData {
  label: string;
  isActive?: boolean;
  isPrevious?: boolean;
  isCompound?: boolean;
}

interface EdgeData {
  event?: string;
  isClickable?: boolean;
  isActive?: boolean;
}

/**
 * Convert machine shape to ReactFlow nodes and edges
 */
function shapeToReactFlow(shape: MachineShape): { nodes: Node<NodeData>[]; edges: Edge<EdgeData>[] } {
  const nodes: Node<NodeData>[] = [];
  const edges: Edge<EdgeData>[] = [];

  // Extract state names for layout
  const stateNames: string[] = [];
  shape.states.forEach((_stateNode, fullKey) => {
    stateNames.push(fullKey);
  });

  // Simple grid layout
  const cols = Math.ceil(Math.sqrt(stateNames.length));

  stateNames.forEach((stateName, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    // Convert dots to underscores for node IDs (ReactFlow compatibility)
    const nodeId = stateName.replace(/\./g, '_');

    nodes.push({
      id: nodeId,
      type: 'simple',
      data: { label: stateName },
      position: {
        x: 100 + col * 200,
        y: 100 + row * 150,
      },
    });
  });

  // Create edges from transitions
  shape.transitions.forEach((transitions, fromState) => {
    transitions.forEach((toState, event) => {
      // Handle special syntax like '^Inactive' (exit to parent)
      let targetState = toState;
      if (toState.startsWith('^')) {
        targetState = toState.substring(1);
      }

      // Convert dots to underscores for edge source/target
      const sourceId = fromState.replace(/\./g, '_');
      const targetId = targetState.replace(/\./g, '_');

      edges.push({
        id: `${fromState}-${toState}-${event}`,
        source: sourceId,
        target: targetId,
        label: event,
        type: 'floating',
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        data: {
          event,
        },
      });
    });
  });

  return { nodes, edges };
}

/**
 * HSMReactFlowInspectorV2 - Adapter that converts HSM machine shape to ReactFlow V2 format
 *
 * This wrapper handles:
 * 1. Shape extraction from machine
 * 2. Conversion to ReactFlow nodes/edges
 * 3. State change subscription for highlighting
 * 4. Event dispatch for interactive transitions
 */
export const HSMReactFlowInspectorV2: React.FC<HSMReactFlowInspectorV2Props> = ({
  machine,
  interactive = true,
}) => {
  // Step 1: Extract shape from machine
  const shape = useMemo(() => machine.shape?.getState(), [machine]);

  // Step 2: Convert to ReactFlow format
  const graphData = useMemo(() => {
    if (!shape) return null;
    return shapeToReactFlow(shape);
  }, [shape]);

  // Step 3: Subscribe to state changes for highlighting
  const deepestMachine = (() => {
    let cursor: any = machine;
    let last: any = machine;
    let guard = 0;
    while (cursor && guard++ < 25) {
      last = cursor;
      const s = cursor.getState?.();
      const next = s?.data?.machine;
      if (!next) break;
      cursor = next;
    }
    return last;
  })();

  // Subscribe to deepest machine for reactivity
  const currentChange = useMachine(deepestMachine || machine) as TransitionEvent<StateNode, StateNode>;

  // Compute full state path
  const fullPath = (() => {
    const currentMachineState = machine.shape?.getState();
    const stateKey = currentMachineState?.key || '';

    // If state key already contains dots, it's a flattened full path
    if (stateKey.includes('.')) {
      return stateKey;
    }

    // Otherwise, walk nested machines to build full path
    const parts: string[] = [];
    let cursor: any = machine;
    let guard = 0;
    while (cursor && guard++ < 25) {
      const s = cursor.getState?.();
      if (!s) break;
      parts.push(s.key);
      cursor = s?.data?.machine;
    }
    return parts.join('.');
  })();

  // Node IDs use underscores instead of dots
  const currentState = fullPath.replace(/\./g, '_');

  // Step 4: Get previous state for edge highlighting
  const rawPreviousState = currentChange?.from?.fullKey || currentChange?.from?.key || String(currentChange?.from || '');
  const previousState = rawPreviousState.replace(/\./g, '_');

  // Step 5: Create dispatch function for edge clicks
  const dispatch = useCallback(
    (event: { type: string }) => {
      machine.send(event.type);
    },
    [machine]
  );

  if (!graphData) {
    return <div>No shape data available</div>;
  }

  return (
    <ReactFlowInspectorV2
      value={currentState}
      nodes={graphData.nodes}
      edges={graphData.edges}
      previousState={previousState}
      dispatch={dispatch}
      interactive={interactive}
    />
  );
};
