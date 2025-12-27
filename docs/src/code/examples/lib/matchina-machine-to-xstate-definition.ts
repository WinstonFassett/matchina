import type { FactoryMachine, StateMatchboxFactory } from "matchina";
import { resolveState } from "./state-utils";

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

// May be needed for future xstate features
// function getChildMachine(state: any): FactoryMachine<any> | undefined {
//   return state?.data?.machine || state?.machine;
// }

// function isStateFinal(state: any): boolean {
//   return !!state?.data?.final;
// }
export function getXStateDefinition<
  F extends FactoryMachine<{
    states: StateMatchboxFactory<any>;
    transitions: any;
  }>,
>(machine: F, parentKey?: string) {
  // Check if machine has a shape store (for hierarchical machines)
  const shape = (machine as any).shape;
  if (shape) {
    // For machines with shape (flattened or nested), use shape for structure
    return buildDefinitionFromShape(shape.getState(), machine, parentKey);
  }
  
  // Fall back to runtime introspection for simple flat machines and nested machines without shape yet
  type StateStack = { key: string; fullKey: string }[];

  function buildDefinition(
    machine: FactoryMachine<any>,
    parentKey: string | undefined,
    stack: StateStack
  ) {
    const initialState = machine.getState();
    const declaredInitial = (machine as any).initialKey ?? initialState.key;
    const definition = {
      initial: declaredInitial,
      states: {} as Record<string, any>,
    };

    Object.entries(machine.states).forEach(([key, _state]) => {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      // console.log('state', key, {fullKey, parentKey});
      definition.states[key] = { key, fullKey, on: {} };
    });

    Object.entries(machine.transitions).forEach(([fromKey, events]) => {
      Object.entries(events as object).forEach(([event, entry]) => {
        // Check for inspectable function transitions (created with t() helper)
        if (typeof entry === 'function') {
          if ((entry as any)._targets) {
            // Function has inspection metadata - show all possible targets
            definition.states[fromKey].on[event] = (entry as any)._targets;
            return;
          }
          // Skip uninspectable functions
          return;
        }
        const resolved = resolveState(machine.states, fromKey, entry);
        definition.states[fromKey].on[event] = resolved.key;
      });
    });

    // Auto-discover nested machines from state factories with .machineFactory (from submachine helper)
    Object.entries(machine.states).forEach(([stateKey, stateFactory]) => {
      const machineFactory = (stateFactory as any)?.machineFactory;
      if (!machineFactory?.def) {
        return;  // Must have .def - no function calls!
      }

      try {
        // Get definition from factory - this is the schema, no instantiation needed
        const nestedDef = machineFactory.def;

        // For building xstate definition, we need a machine-like object
        // Create a pseudo-machine from the definition
        const nestedMachine = {
          states: nestedDef.states,
          transitions: nestedDef.transitions,
          initialKey: nestedDef.initial,
          getState: () => ({ key: nestedDef.initial })  // Minimal stub for compatibility
        };
        // Override buildDefinition to skip function transitions for nested machines
        const buildNestedDefinition = (machine: any, parentKey: string | undefined, stack: any) => {
          const initialState = machine.getState();
          const declaredInitial = (machine as any).initialKey ?? initialState.key;
          const definition = {
            initial: declaredInitial,
            states: {} as Record<string, any>,
          };

          Object.entries(machine.states).forEach(([key, _state]) => {
            const fullKey = parentKey ? `${parentKey}.${key}` : key;
            definition.states[key] = { key, fullKey, on: {} };
          });

          Object.entries(machine.transitions).forEach(([fromKey, events]) => {
            Object.entries(events as object).forEach(([event, entry]) => {
              // Skip function transitions - they can't be statically resolved
              if (typeof entry === 'function') {
                return;
              }
              const resolved = resolveState(machine.states, fromKey, entry);
              definition.states[fromKey].on[event] = resolved.key;
            });
          });

          return definition;
        };

        if (nestedMachine && nestedDef.states) {
          const childFullKey = parentKey ? `${parentKey}.${stateKey}` : stateKey;
          const childStack = [...stack, { key: stateKey, fullKey: childFullKey }];
          const childDefinition = buildNestedDefinition(nestedMachine as any, childFullKey, childStack);

          if (!definition.states[stateKey]) {
            definition.states[stateKey] = { on: {} };
          }
          if (nestedMachine.initialKey !== undefined) {
            definition.states[stateKey].initial = nestedMachine.initialKey;
          }
          definition.states[stateKey].states = childDefinition.states;
          definition.states[stateKey].stack = childStack;

          // Copy parent transitions to nested states for visualization
          // This shows what events are available at the parent level
          const parentTransitions = machine.transitions?.[stateKey] || {};
          for (const [nestedKey, nestedConfig] of Object.entries(childDefinition.states) as [string, any][]) {
            for (const [event, target] of Object.entries(parentTransitions)) {
              // Only add string transitions that aren't already defined
              if (typeof target === 'string' && !nestedConfig.on[event]) {
                nestedConfig.on[event] = target;
              }
            }
          }
        }
      } catch (e) {
        // Skip if nested machine inspection fails
      }
    });

    // Fallback: check current state for nested machine (backward compatibility for non-submachine usage)
    try {
      const currentState = initialState;
      const currentKey = currentState?.key;

      // Only process if not already handled by submachine auto-discovery
      if (currentState?.data?.machine && !definition.states[currentKey]?.states) {
        const childMachine = currentState.data.machine;
        if (childMachine && typeof childMachine.getState === "function") {
          const childFullKey = parentKey ? `${parentKey}.${currentKey}` : currentKey;
          const childStack = [...stack, { key: currentKey, fullKey: childFullKey }];
          const childDefinition = buildDefinition(childMachine, childFullKey, childStack);

          if (!definition.states[currentKey]) {
            definition.states[currentKey] = { on: {} };
          }
          if (childMachine.initialKey !== undefined) {
            definition.states[currentKey].initial = childMachine.initialKey;
          }
          definition.states[currentKey].states = childDefinition.states;
          definition.states[currentKey].stack = childStack;
        }
      }
    } catch (e) {
      // Don't break if nested machine inspection fails
    }

    // Attach stack to top-level states
    Object.values(definition.states).forEach((state: any) => {
      if (!state.stack) {
        state.stack = [...stack, { key: state.key, fullKey: state.fullKey }];
      }
    });
    // console.log('definition', definition);
    return definition;
  }

  return buildDefinition(machine, parentKey, []);
}

/**
 * Build XState-compatible definition from a MachineShape
 * Works for both flattened and nested machines
 */
function buildDefinitionFromShape(shape: any, machine: any, parentKey?: string) {
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
