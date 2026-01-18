/**
 * Utilities for working with flattened state keys
 */

/**
 * Parse a flattened state key into parent and child components
 *
 * @param key - Flattened state key (e.g., "Payment.MethodEntry")
 * @returns Object with parent, child, parts, and full properties
 */
export function parseFlatStateKey(key: string) {
  const parts = key.split(".");
  return {
    parent: parts[0],
    child: parts[1],
    parts,
    full: key,
  };
}

export function isChildFinal(machine: any, state: any): boolean {
  // Check if state data has final flag
  if (state?.data?.final) {
    return true;
  }

  // Check if state has no outgoing transitions
  const transitions = machine.transitions[state.key];
  if (!transitions || Object.keys(transitions).length === 0) {
    return true;
  }

  // Check if this is a leaf state (no further child states)
  const delimiter = ".";
  if (state.key.includes(delimiter)) {
    const parentKey = state.key.slice(
      0,
      Math.max(0, state.key.lastIndexOf(delimiter))
    );

    // Look for any child states of the same parent
    const childStates = Object.keys(machine.transitions).filter(
      (key) => key.startsWith(parentKey + delimiter) && key !== state.key
    );

    // If there are no other child states, this might be a final child
    // But we need to check if there are transitions that don't go to other child states
    const hasNonChildTransitions = Object.values(transitions).some((target) => {
      if (typeof target === "string") {
        return !target.startsWith(parentKey + delimiter);
      }
      return false;
    });

    // If all transitions go to other child states or are special transitions, consider it final
    if (!hasNonChildTransitions && childStates.length === 0) {
      return true;
    }
  }

  return false;
}

