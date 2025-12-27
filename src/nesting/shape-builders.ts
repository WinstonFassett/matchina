/**
 * Shape builders for different machine types
 *
 * These functions compile static shape data at definition-time.
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
