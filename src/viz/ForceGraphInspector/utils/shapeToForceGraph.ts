import type { MachineShape, StateNode } from "../../../hsm/shape-types";

export interface ForceGraphNode {
  id: string;
  name: string;
  val?: number;
  color?: string;
  fullKey: string;      // For state matching
  isInitial?: boolean;
}

export interface ForceGraphLink {
  source: string;       // ⭐ STRING ID, not object
  target: string;       // ⭐ STRING ID, not object
  event: string;        // Event name
  value?: number;
}

export interface ForceGraphData {
  nodes: ForceGraphNode[];
  links: ForceGraphLink[];
  nodeIds: Set<string>;
}

/**
 * Convert MachineShape to ForceGraph data format
 * 
 * Critical: Links use STRING IDs for source/target, not node objects.
 * This fixes the original bug where ForceGraph tried to mutate strings.
 */
export function buildForceGraphData(
  shape: MachineShape
): ForceGraphData {
  const nodes: ForceGraphNode[] = [];
  const links: ForceGraphLink[] = [];
  const nodeIds = new Set<string>();

  // Extract nodes from shape.states
  for (const [fullKey, stateNode] of shape.states.entries()) {
    const node: ForceGraphNode = {
      id: fullKey,
      name: stateNode.key,           // Display just leaf name
      fullKey: stateNode.fullKey,    // For state matching later
      isInitial: fullKey === shape.initialKey,
      val: fullKey === shape.initialKey ? 15 : 10,  // Initial slightly larger
      color: fullKey === shape.initialKey ? '#60a5fa' : '#8b5cf6',
    };
    
    nodes.push(node);
    nodeIds.add(fullKey);
  }

  // Extract links from shape.transitions
  for (const [fromState, eventMap] of shape.transitions.entries()) {
    for (const [eventName, toState] of eventMap.entries()) {
      // Validate that both source and target states exist
      if (shape.states.has(fromState) && shape.states.has(toState)) {
        links.push({
          source: fromState,    // String ID
          target: toState,      // String ID
          event: eventName,     // Custom property for labels
          value: 1,            // Link strength
        });
      } else {
        // Skip invalid transitions but could warn in development
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Invalid transition: ${fromState} -> ${toState} via ${eventName}`);
        }
      }
    }
  }

  return {
    nodes,
    links,
    nodeIds,
  };
}

/**
 * Helper function to create a single ForceGraphNode
 */
function buildForceGraphNode(
  stateNode: StateNode,
  isInitial: boolean = false
): ForceGraphNode {
  return {
    id: stateNode.fullKey,
    name: stateNode.key,           // Display just leaf name
    val: isInitial ? 15 : 10,      // Initial slightly larger
    color: isInitial ? '#60a5fa' : '#8b5cf6',
    fullKey: stateNode.fullKey,    // For state matching later
    isInitial,
  };
}

/**
 * Helper function to build links from transitions
 */
function buildForceGraphLinks(
  shape: MachineShape
): ForceGraphLink[] {
  const links: ForceGraphLink[] = [];
  
  // Iterate transitions
  for (const [fromState, eventMap] of shape.transitions.entries()) {
    for (const [eventName, toState] of eventMap.entries()) {
      // Validate toState exists in shape.states
      if (shape.states.has(toState)) {
        links.push({
          source: fromState,    // String ID
          target: toState,      // String ID
          event: eventName,     // Custom property for labels
          value: 1,            // Link strength
        });
      }
    }
  }
  
  return links;
}
