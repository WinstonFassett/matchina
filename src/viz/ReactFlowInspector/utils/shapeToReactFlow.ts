import type { Node, Edge } from "reactflow";
import type { MachineShape } from "../../../hsm/shape-types";

export interface ReactFlowGraphData {
  nodes: Node[];
  edges: Edge[];
  nodeIds: Set<string>;
  groupIds: Set<string>; // Compound states that contain children
}

/**
 * Convert MachineShape to ReactFlow node/edge format
 *
 * Creates nodes from all states (including hierarchical) with full keys.
 * Creates edges from all transitions.
 * Identifies compound states (parents) and marks them for visual grouping.
 * Positions are placeholder (0,0) - ELK layout will calculate real positions.
 *
 * Design principle: Just format conversion, no layout logic here.
 */
export function buildReactFlowGraph(
  shape: MachineShape
): ReactFlowGraphData {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeIds = new Set<string>();
  const groupIds = new Set<string>();
  let edgeId = 0;

  // Identify compound states (states that have children)
  const compoundStates = new Set<string>();
  for (const [childKey, parentKey] of shape.hierarchy.entries()) {
    if (parentKey) {
      compoundStates.add(parentKey);
    }
  }

  // First pass: Create nodes from all states
  for (const [fullKey, stateNode] of shape.states.entries()) {
    const parentKey = shape.hierarchy.get(fullKey);
    const isCompound = compoundStates.has(fullKey);
    
    const node: Node = {
      id: fullKey,
      position: { x: 0, y: 0 }, // Placeholder - ELK will set real positions
      data: {
        label: stateNode.key, // Display just leaf name
        fullKey: stateNode.fullKey, // For state matching
        isActive: false, // Will be updated by component
        isPrevious: false, // Will be updated by component
        parent: parentKey, // For hierarchy visualization
        isCompound: isCompound, // For styling compound states
      },
      type: "custom",
      // Parent assignment for ReactFlow's built-in hierarchy (if using subgraph)
      // Note: Full subgraph support would require additional setup
      parentNode: parentKey, 
    };

    nodes.push(node);
    nodeIds.add(fullKey);
    
    if (isCompound) {
      groupIds.add(fullKey);
    }
  }

  // Second pass: Create edges from transitions
  for (const [fromState, eventMap] of shape.transitions.entries()) {
    for (const [eventName, toState] of eventMap.entries()) {
      // Validate both states exist
      if (shape.states.has(fromState) && shape.states.has(toState)) {
        const edge: Edge = {
          id: `${fromState}-${toState}-${eventName}-${edgeId++}`,
          source: fromState,
          target: toState,
          label: eventName,
          type: "custom",
          data: {
            event: eventName,
            isClickable: false, // Will be updated by component
          },
        };

        edges.push(edge);
      } else {
        // Skip invalid transitions but warn in development
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `Invalid transition: ${fromState} -> ${toState} via ${eventName}`
          );
        }
      }
    }
  }

  return {
    nodes,
    edges,
    nodeIds,
    groupIds,
  };
}
