/**
 * Shape builders for different machine types
 *
 * buildFlattenedShape: computes static shape from flattened transitions (eager)
 * buildHierarchicalShape: computes shape from hierarchical machine structure (lazy/runtime)
 */

import type { FactoryMachine } from "../factory-machine";
import type { MachineShape, StateNode } from "./shape-types";
import { getTargets } from "../transition-helper";

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
      let finalTarget = target;
      if (typeof target === "string") {
        // For flattened machines, convert namespaced targets to leaf state names
        if (target.includes('.')) {
          finalTarget = target.split('.').pop() || target;
        }
        trans.set(String(eventKey), finalTarget);
      } else if (typeof target === "function") {
        // Check for t() helper metadata first
        const targets = getTargets(target);
        if (targets && targets.length > 0) {
          // Has metadata from t() helper - use all discovered targets
          for (const t of targets) {
            let finalTarget = t;
            if (t.includes('.')) {
              finalTarget = t.split('.').pop() || t;
            }
            trans.set(String(eventKey), finalTarget);
          }
        } else {
          // Try automatic discovery for simple transitions
          try {
            // Call with dummy params
            const dummyParams = Array(target.length).fill(undefined);
            const result = target(...dummyParams);

            // Check if result is a state (simple form) or event handler (curried form)
            if (result && typeof result === 'object' && 'key' in result) {
              // Simple form: (params) => state
              let finalTarget = result.key;
              if (finalTarget.includes('.')) {
                finalTarget = finalTarget.split('.').pop() || finalTarget;
              }
              trans.set(String(eventKey), finalTarget);
            } else if (typeof result === 'function') {
              // Curried form: (params) => (ev) => state
              const dummyEvent = { from: { data: {} }, to: { data: {} } };
              const state = result(dummyEvent);
              if (state && typeof state === 'object' && 'key' in state) {
                let finalTarget = state.key;
                if (finalTarget.includes('.')) {
                  finalTarget = finalTarget.split('.').pop() || finalTarget;
                }
                trans.set(String(eventKey), finalTarget);
              }
            }
          } catch (e) {
            // Can't auto-discover - transition won't show in visualization
            // Use t() helper for complex branching logic
          }
        }
      }
    }
    transitionMap.set(stateStr, trans);

    // Track all parent states we need to create
    if (parentKey) {
      parentStates.add(parentKey);
    }
  }

  // Create hierarchy entries for parent states (but don't create synthetic state nodes)
  // This allows the visualization to build the proper tree structure
  for (const parentKey of parentStates) {
    if (!hierarchy.has(parentKey)) {
      const parts = parentKey.split(".");
      const grandParentKey = parts.length > 1 ? parts.slice(0, -1).join(".") : undefined;
      hierarchy.set(parentKey, grandParentKey);
    }
  }

  // Don't create synthetic parent states - let the hierarchy data represent the actual structure
  // Parent states will be represented by their children in the hierarchy, not as separate nodes

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
  const machineWithInitial = machine as { initialKey?: string };
  const initialKey = machineWithInitial.initialKey ?? initialState?.key ?? 'Unknown';

  // Recursively walk all states in machine hierarchy
  function walkMachine(m: { states?: Record<string, any>; transitions?: Record<string, Record<string, any>> }, parentFullKey?: string): void {
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
          // Simple string transition
          trans.set(event, target);
        } else if (typeof target === 'function') {
          // Check for t() helper metadata first
          const targets = getTargets(target);
          if (targets && targets.length > 0) {
            // Has metadata from t() helper - use all discovered targets
            for (const t of targets) {
              trans.set(event, t);
            }
          } else {
            // Try automatic discovery for simple transitions
            try {
              // Call with dummy params
              const dummyParams = Array(target.length).fill(undefined);
              const result = target(...dummyParams);

              // Check if result is a state (simple form) or event handler (curried form)
              if (result && typeof result === 'object' && 'key' in result) {
                // Simple form: (params) => state
                trans.set(event, result.key);
              } else if (typeof result === 'function') {
                // Curried form: (params) => (ev) => state
                const dummyEvent = { from: { data: {} }, to: { data: {} } };
                const state = result(dummyEvent);
                if (state && typeof state === 'object' && 'key' in state) {
                  trans.set(event, state.key);
                }
              }
            } catch (e) {
              // Can't auto-discover - transition won't show in visualization
              // Use t() helper for complex branching logic
            }
          }
        }
      }
      transitionMap.set(fullKey, trans);

      // Check if state has a submachine
      const stateFactoryWithMachine = stateFactory as { machineFactory?: () => { machine?: any; } };
      const machineFactory = stateFactoryWithMachine?.machineFactory;
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
