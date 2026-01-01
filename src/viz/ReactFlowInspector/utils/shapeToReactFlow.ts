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
    
    // Replace dots with underscores for ReactFlow compatibility
    const reactFlowId = fullKey.replace(/\./g, '_');
    const reactFlowParentId = parentKey?.replace(/\./g, '_');

    // Create ALL states as nodes - ReactFlow needs all nodes for hierarchical layout
    // The hierarchy is handled by parentId, not by filtering nodes
    const node: Node = {
      id: reactFlowId,
      position: { x: 0, y: 0 }, // Placeholder - ELK will set real positions
      data: {
        label: stateNode.key, // Display just leaf name
        fullKey: stateNode.fullKey, // Store original fullKey for state matching
        isActive: false, // Will be updated by component
        isPrevious: false, // Will be updated by component
        parent: parentKey, // For hierarchy visualization
        isCompound: isCompound, // For styling compound states
      },
      type: isCompound ? 'group' : 'custom', // Use group type for compound states
      // Parent assignment: child nodes have parentId and extent constraint
      ...(reactFlowParentId && {
        parentId: reactFlowParentId,
        extent: 'parent' as const, // Keep child inside parent bounds (from working example)
      }),
    };

    nodes.push(node);
    nodeIds.add(reactFlowId);
    
    if (isCompound) {
      groupIds.add(reactFlowId);
    }
  }

  // Second pass: Create edges from transitions
  // Note: We don't add "missing" transition targets as nodes anymore.
  // All states should be in the shape. Targets are resolved relative to their source's parent.
  for (const [fromState, eventMap] of shape.transitions.entries()) {
    // Get the parent of the source state for resolving relative targets
    const fromParent = shape.hierarchy.get(fromState);

    for (const [eventName, toState] of eventMap.entries()) {
      // Resolve target to full key (like Mermaid does)
      let resolvedTarget = toState;

      // Check if target already exists as-is (full path given)
      const toReactFlowIdDirect = toState.replace(/\./g, '_');
      if (nodeIds.has(toReactFlowIdDirect)) {
        resolvedTarget = toState;
      } else if (toState.startsWith('^')) {
        // ^Target means go up to parent level - strip the ^ prefix
        resolvedTarget = toState.slice(1);
      } else if (fromParent && !toState.includes('.')) {
        // Relative target within same parent - prepend parent path
        resolvedTarget = `${fromParent}.${toState}`;
      } else if (!toState.includes('.')) {
        // Target is a simple name without parent context (e.g., root state targeting nested state)
        // Search for a state that ends with this name
        for (const fullKey of shape.states.keys()) {
          const parts = fullKey.split('.');
          const leafName = parts[parts.length - 1];
          if (leafName === toState) {
            resolvedTarget = fullKey;
            break;
          }
        }
      }

      // Convert to ReactFlow IDs (replace dots with underscores)
      const fromReactFlowId = fromState.replace(/\./g, '_');
      const toReactFlowId = resolvedTarget.replace(/\./g, '_');

      // Validate both states exist
      if (nodeIds.has(fromReactFlowId) && nodeIds.has(toReactFlowId)) {
        const edge: Edge = {
          id: `${fromReactFlowId}-${toReactFlowId}-${eventName}-${edgeId++}`,
          source: fromReactFlowId,
          target: toReactFlowId,
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
            `Invalid transition: ${fromState} -> ${toState} via ${eventName} (ReactFlow IDs: ${fromReactFlowId} -> ${toReactFlowId})`
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
