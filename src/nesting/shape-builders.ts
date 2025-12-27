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

  // Recursively walk machine hierarchy
  function walkMachine(m: any, parentFullKey?: string): void {
    const state = m.getState?.();
    if (!state) return;

    const currentKey = state.key;
    const fullKey = parentFullKey ? `${parentFullKey}.${currentKey}` : currentKey;

    // Prevent infinite loops in circular hierarchies
    if (visited.has(fullKey)) return;
    visited.add(fullKey);

    // Add current state to shape
    states.set(fullKey, {
      key: currentKey,
      fullKey,
      isFinal: false, // Set properly based on machine finality
      isCompound: false, // Will be true if has children
    });
    hierarchy.set(fullKey, parentFullKey);

    // Collect transitions from this level
    const trans = new Map<string, string>();
    if (m.transitions) {
      for (const [event, target] of Object.entries(m.transitions[currentKey] ?? {})) {
        if (typeof target === 'string') {
          trans.set(event, target);
        }
      }
    }
    transitionMap.set(fullKey, trans);

    // Check for submachine in current state's data
    const submachine = state?.data?.machine;
    if (submachine && typeof submachine.getState === 'function') {
      // Mark current state as compound
      const stateNode = states.get(fullKey);
      if (stateNode) {
        states.set(fullKey, { ...stateNode, isCompound: true });
      }

      // Recursively walk child machine
      walkMachine(submachine, fullKey);
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
