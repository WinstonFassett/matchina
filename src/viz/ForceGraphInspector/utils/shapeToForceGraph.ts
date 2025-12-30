import type { MachineShape, StateNode } from "../../../hsm/shape-types";

export interface ForceGraphNode {
  id: string;
  name: string;
  val?: number;
  color?: string;
  fullKey: string;      // For state matching
  isInitial?: boolean;
  isGroup?: boolean;    // For compound states
  level?: number;       // Hierarchy depth
  group?: string;       // Parent group ID
}

export interface ForceGraphLink {
  source: string;       // ⭐ STRING ID, not object
  target: string;       // ⭐ STRING ID, not object
  event: string;        // Event name
  value?: number;
  type?: 'transition' | 'hierarchy';  // Link type for styling
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
 * 
 * Enhanced: Creates group nodes for compound states and hierarchy links.
 */
export function buildForceGraphData(
  shape: MachineShape,
  options: { showHierarchy?: boolean } = {}
): ForceGraphData {
  const { showHierarchy = true } = options;
  const nodes: ForceGraphNode[] = [];
  const links: ForceGraphLink[] = [];
  const nodeIds = new Set<string>();
  const groupNodes = new Set<string>();

  // First pass: Create all state nodes (including compound states as groups)
  for (const [fullKey, stateNode] of shape.states.entries()) {
    const level = fullKey.includes('.') ? fullKey.split('.').length - 1 : 0;
    const parentKey = shape.hierarchy.get(fullKey);
    
    // Determine if this is a compound state (has children)
    const hasChildren = Array.from(shape.hierarchy.entries())
      .some(([_, parent]) => parent === fullKey);
    
    const node: ForceGraphNode = {
      id: fullKey,
      name: stateNode.key,           // Display just leaf name
      fullKey: stateNode.fullKey,    // For state matching later
      isInitial: fullKey === shape.initialKey,
      val: fullKey === shape.initialKey ? 15 : 10,  // Initial slightly larger
      color: fullKey === shape.initialKey ? '#60a5fa' : '#8b5cf6',
      level,
      group: parentKey || undefined,
      isGroup: showHierarchy && hasChildren
    };
    
    nodes.push(node);
    nodeIds.add(fullKey);
    
    if (hasChildren) {
      groupNodes.add(fullKey);
    }
  }

  // Second pass: Create transition links
  for (const [fromState, eventMap] of shape.transitions.entries()) {
    for (const [eventName, toState] of eventMap.entries()) {
      // For flattened HSMs, transitions use short names but nodes use full keys
      // We need to map short names to full keys
      let actualFromState = fromState;
      let actualToState = toState;
      
      if (shape.type === 'flattened') {
        // Find the full key that matches the short name
        for (const [fullKey, stateNode] of shape.states.entries()) {
          if (stateNode.key === fromState) {
            actualFromState = fullKey;
          }
          if (stateNode.key === toState) {
            actualToState = fullKey;
          }
        }
      }
      
      // Only add link if both states exist (skip invalid transitions)
      if (shape.states.has(actualFromState) && shape.states.has(actualToState)) {
        links.push({
          source: actualFromState,    // Use full key for flattened HSMs
          target: actualToState,      // Use full key for flattened HSMs
          event: eventName,           // Custom property for labels
          value: 1,                  // Link strength
          type: 'transition'
        });
      }
    }
  }

  // Third pass: Create hierarchy links (parent-child relationships)
  if (showHierarchy) {
    for (const [childKey, parentKey] of shape.hierarchy.entries()) {
      if (parentKey && shape.states.has(childKey) && shape.states.has(parentKey)) {
        links.push({
          source: parentKey,
          target: childKey,
          event: 'contains',
          value: 0.5,  // Weaker link for hierarchy
          type: 'hierarchy'
        });
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
