import type { FactoryMachine, StateMatchboxFactory } from "matchina";

/**
 * Get the current active state path for both hierarchical and flattened machines.
 * Returns dot-joined path (e.g., "Active.Empty" or "Payment.MethodEntry").
 */
export function getActiveStatePath(machine: FactoryMachine<any>): string {
  try {
    const currentState = machine.getState();
    const stateKey = currentState?.key || '';
    
    // For flattened machines, state key already contains the full path
    if (stateKey.includes('.')) {
      return stateKey;
    }
    
    // For hierarchical machines, walk the nested machine chain
    const parts: string[] = [];
    let cursor: any = machine;
    let guard = 0;
    while (cursor && guard++ < 25) {
      const state = cursor.getState?.();
      if (!state) break;
      parts.push(state.key);
      cursor = state?.data?.machine;
    }
    return parts.length ? parts.join('.') : 'Unknown';
  } catch {
    return 'Unknown';
  }
}

/**
 * Build a visualization tree from a machine's shape or hierarchical structure.
 * 
 * Prefer shape when available (flattened and nested machines with shape metadata).
 * Fall back to runtime introspection for hierarchical machines without shapes.
 * 
 * For best results, use createMachineFromFlat() to create flattened machines
 * which automatically get shape metadata attached.
 */
export function buildVisualizerTree<
  F extends FactoryMachine<{
    states: StateMatchboxFactory<any>;
    transitions: any;
  }>,
>(machine: F, parentKey?: string) {
  const shape = (machine as any).shape?.getState();
  if (shape) {
    // Use shape when available (preferred path)
    return buildVisualizerTreeFromShape(shape);
  }

  // Fallback to runtime introspection for hierarchical machines
  return buildVisualizerTreeFromHierarchy(machine, parentKey);
}

/**
 * Build tree from hierarchical machine structure via runtime introspection.
 * Used for nested machines that don't have shape metadata.
 * This is a fallback - prefer shapes when available.
 */
function buildVisualizerTreeFromHierarchy(machine: any, parentKey?: string) {
  type XStateNode = {
    key: string;
    fullKey: string;
    on: Record<string, string>;
    states?: Record<string, XStateNode>;
    initial?: string;
  };

  const initialState = machine.getState();
  const declaredInitial = (machine as any).initialKey ?? initialState?.key ?? 'Unknown';

  const definition: {
    initial: string;
    states: Record<string, any>;
  } = {
    initial: declaredInitial,
    states: {},
  };

  // Build flat state list
  Object.entries(machine.states ?? {}).forEach(([key, _state]) => {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;
    definition.states[key] = {
      key,
      fullKey,
      on: {},
    };
  });

  // Add transitions
  Object.entries(machine.transitions ?? {}).forEach(([fromKey, events]) => {
    Object.entries(events as object).forEach(([event, entry]) => {
      // Skip function transitions - they can't be statically resolved
      if (typeof entry === 'function') {
        return;
      }
      definition.states[fromKey].on[event] = entry;
    });
  });

  // Auto-discover nested machines from submachine markers
  Object.entries(machine.states ?? {}).forEach(([stateKey, stateFactory]) => {
    const machineFactory = (stateFactory as any)?.machineFactory;
    if (!machineFactory) {
      return;
    }

    try {
      // Create an instance to get the child machine
      // machineFactory() returns { machine: childMachine } for submachines
      const result = machineFactory();
      const childMachine = result.machine || result;
      const childFullKey = parentKey ? `${parentKey}.${stateKey}` : stateKey;

      // Try to get shape first (preferred for flat machines)
      const shape = (childMachine as any).shape?.getState();
      let childDefinition;

      if (shape) {
        // Use shape-based visualization
        childDefinition = buildVisualizerTreeFromShape(shape);
      } else {
        // Fallback to hierarchy-based visualization
        childDefinition = buildVisualizerTreeFromHierarchy(
          childMachine,
          childFullKey
        );
      }

      if (!definition.states[stateKey]) {
        definition.states[stateKey] = { on: {} };
      }
      if (childMachine.initialKey !== undefined) {
        definition.states[stateKey].initial = childMachine.initialKey;
      }
      definition.states[stateKey].states = childDefinition.states;
    } catch (e) {
      // Skip if nested machine inspection fails
      console.error('Failed to inspect nested machine:', e);
    }
  });

  // Fallback: check current state for inline nested machine
  try {
    const currentKey = initialState?.key;
    if (
      currentKey &&
      initialState?.data?.machine &&
      !definition.states[currentKey]?.states
    ) {
      const childMachine = initialState.data.machine;
      if (childMachine && typeof childMachine.getState === 'function') {
        const childFullKey = parentKey ? `${parentKey}.${currentKey}` : currentKey;
        const childDefinition = buildVisualizerTreeFromHierarchy(
          childMachine,
          childFullKey
        );

        if (!definition.states[currentKey]) {
          definition.states[currentKey] = { on: {} };
        }
        if (childMachine.initialKey !== undefined) {
          definition.states[currentKey].initial = childMachine.initialKey;
        }
        definition.states[currentKey].states = childDefinition.states;
      }
    }
  } catch (e) {
    // Don't break if nested machine inspection fails
  }

  return definition;
}

/**
 * Build XState-compatible tree from a MachineShape.
 * This converts static shape metadata into a renderable tree structure.
 */
function buildVisualizerTreeFromShape(shape: any) {
  type XStateNode = {
    key: string;
    fullKey: string;
    on: Record<string, string>;
    states?: Record<string, XStateNode>;
    initial?: string;
  };

  // Build tree recursively using hierarchy information from shape
  function buildNode(fullKey: string): XStateNode {
    const node = shape.states.get(fullKey);
    if (!node) {
      throw new Error(`State not found in shape: ${fullKey}`);
    }

    const state: XStateNode = {
      key: node.key,
      fullKey,
      on: {}
    };

    // Get transitions from this state
    const trans = shape.transitions.get(fullKey);
    if (trans) {
      for (const [event, target] of trans) {
        state.on[event] = target;
      }
    }

    // Find all direct children
    const children: string[] = [];
    for (const [stateFullKey, parentFullKey] of shape.hierarchy.entries()) {
      if (parentFullKey === fullKey) {
        children.push(stateFullKey);
      }
    }

    // If has children, build nested states
    if (children.length > 0) {
      state.states = {};
      for (const childFullKey of children) {
        const childNode = buildNode(childFullKey);
        state.states[childNode.key] = childNode;
      }
      // Set initial to first child (simplified - could be enhanced to find actual initial)
      state.initial = children[0]?.split('.').pop();
    }

    return state;
  }

  // Build all root-level states
  const rootStates: Record<string, XStateNode> = {};
  for (const [fullKey, parentFullKey] of shape.hierarchy.entries()) {
    if (parentFullKey === undefined) {
      const node = buildNode(fullKey);
      rootStates[node.key] = node;
    }
  }

  return {
    initial: shape.initialKey,
    states: rootStates
  };
}
