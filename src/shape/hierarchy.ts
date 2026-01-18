/**
 * Hierarchy utilities for machine structure analysis
 */

/**
 * Get machine hierarchy from transitions
 * Extracts parent-child relationships from flattened state keys
 */
export function getMachineHierarchy(
  transitions: Record<string, Record<string, any>>
): Map<string, string | undefined> {
  const hierarchy = new Map<string, string | undefined>();
  
  for (const stateKey of Object.keys(transitions)) {
    const parts = stateKey.split(".");
    const parentKey = parts.length > 1 ? parts.slice(0, -1).join(".") : undefined;
    hierarchy.set(stateKey, parentKey);
  }
  
  return hierarchy;
}

/**
 * Get all parent states for a given state key
 */
export function getParentStates(
  stateKey: string,
  hierarchy: Map<string, string | undefined>
): string[] {
  const parents: string[] = [];
  let current = hierarchy.get(stateKey);
  
  while (current) {
    parents.push(current);
    current = hierarchy.get(current);
  }
  
  return parents;
}

/**
 * Check if a state is a child of another state
 */
export function isChildState(
  childKey: string,
  parentKey: string,
  hierarchy: Map<string, string | undefined>
): boolean {
  let current = hierarchy.get(childKey);
  
  while (current) {
    if (current === parentKey) {
      return true;
    }
    current = hierarchy.get(current);
  }
  
  return false;
}

/**
 * Get root states (states with no parent)
 */
export function getRootStates(
  hierarchy: Map<string, string | undefined>
): string[] {
  const roots: string[] = [];
  
  for (const [stateKey, parentKey] of hierarchy.entries()) {
    if (!parentKey) {
      roots.push(stateKey);
    }
  }
  
  return roots;
}

/**
 * Get child states for a given parent
 */
export function getChildStates(
  parentKey: string,
  hierarchy: Map<string, string | undefined>
): string[] {
  const children: string[] = [];
  
  for (const [stateKey, parent] of hierarchy.entries()) {
    if (parent === parentKey) {
      children.push(stateKey);
    }
  }
  
  return children;
}
