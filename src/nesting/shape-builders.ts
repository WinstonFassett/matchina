/**
 * Shape builders for different machine types
 *
 * buildFlattenedShape: computes static shape from flattened transitions (eager)
 * buildHierarchicalShape: computes shape from hierarchical machine structure (lazy/runtime)
 */

import type { FactoryMachine } from "../factory-machine";
import type { MachineShape, StateNode } from "./shape-types";

/**
 * Build shape from flattened machine
 *
 * Flattened shapes are completely static - computed once from
 * the flattened state structure.
 */
export function buildFlattenedShape(
  transitions: Record<string, Record<string, any>>,
  initialKey: string
): MachineShape {
  const states = new Map<string, StateNode>();
  const transitionMap = new Map<string, Map<string, string>>();
  const hierarchy = new Map<string, string | undefined>();
  const parentStates = new Set<string>(); // Track which parent states we've created

  // Get all state keys from transitions
  for (const [stateKey, stateTransitions] of Object.entries(transitions)) {
    const stateStr = String(stateKey);
    const isFinal = Object.keys(stateTransitions).length === 0;
    const parts = stateStr.split(".");
    const parentKey = parts.length > 1 ? parts.slice(0, -1).join(".") : undefined;

    states.set(stateStr, {
      key: parts[parts.length - 1],
      fullKey: stateStr,
      isFinal,
      isCompound: parentKey !== undefined, // leaf states in hierarchy are compound if they have a parent
    });

    hierarchy.set(stateStr, parentKey);

    // Convert transitions to Map
    const trans = new Map<string, string>();
    for (const [eventKey, target] of Object.entries(stateTransitions)) {
      if (typeof target === "string") {
        trans.set(String(eventKey), target);
      }
    }
    transitionMap.set(stateStr, trans);

    // Track all parent states we need to create
    if (parentKey) {
      parentStates.add(parentKey);
    }
  }

  // Create synthetic parent states that don't have direct transitions
  for (const parentKey of parentStates) {
    if (!states.has(parentKey)) {
      const parts = parentKey.split(".");
      const grandParentKey = parts.length > 1 ? parts.slice(0, -1).join(".") : undefined;
      
      states.set(parentKey, {
        key: parts[parts.length - 1],
        fullKey: parentKey,
        isFinal: false, // parent states are never final
        isCompound: true, // parent states contain children
      });
      
      hierarchy.set(parentKey, grandParentKey);
      transitionMap.set(parentKey, new Map()); // parent has no direct transitions
    }
  }

  return {
    states,
    transitions: transitionMap,
    hierarchy,
    initialKey,
    type: "flattened",
  };
}

/**
 * Build shape from hierarchical machine via runtime introspection
 *
 * Used for nested machines that have submachines in state data.
 * Walks the hierarchy by inspecting actual machine instances.
 */
export function buildHierarchicalShape(machine: FactoryMachine<any>): MachineShape {
  const states = new Map<string, StateNode>();
  const transitionMap = new Map<string, Map<string, string>>();
  const hierarchy = new Map<string, string | undefined>();
  const visited = new Set<string>();

  const initialState = machine.getState();
  const initialKey = (machine as any).initialKey ?? initialState?.key ?? 'Unknown';

  // Recursively walk all states in machine hierarchy
  function walkMachine(m: any, parentFullKey?: string): void {
    // Iterate over ALL states in the machine, not just the current one
    const machineStates = m.states || {};
    const machineTransitions = m.transitions || {};

    for (const [stateKey, stateFactory] of Object.entries(machineStates)) {
      const fullKey = parentFullKey ? `${parentFullKey}.${stateKey}` : stateKey;

      // Prevent infinite loops
      if (visited.has(fullKey)) continue;
      visited.add(fullKey);

      // Add state to shape
      const stateTransitions = machineTransitions[stateKey] || {};
      const isFinal = Object.keys(stateTransitions).length === 0;

      states.set(fullKey, {
        key: stateKey,
        fullKey,
        isFinal,
        isCompound: false, // Will be updated if has children
      });
      hierarchy.set(fullKey, parentFullKey);

      // Collect transitions
      const trans = new Map<string, string>();
      for (const [event, target] of Object.entries(stateTransitions)) {
        if (typeof target === 'string') {
          trans.set(event, target);
        }
      }
      transitionMap.set(fullKey, trans);

      // Check if state has a submachine
      const machineFactory = (stateFactory as any)?.machineFactory;
      if (machineFactory) {
        try {
          // Create instance to inspect
          const result = machineFactory();
          const childMachine = result.machine || result;

          // Mark current state as compound
          const stateNode = states.get(fullKey);
          if (stateNode) {
            states.set(fullKey, { ...stateNode, isCompound: true });
          }

          // Recursively walk child machine
          walkMachine(childMachine, fullKey);
        } catch (e) {
          // Skip if child machine fails to instantiate
        }
      }
    }
  }

  // Start walking from root
  walkMachine(machine);

  return {
    states,
    transitions: transitionMap,
    hierarchy,
    initialKey,
    type: "nested",
  };
}
