/**
 * State inspection utilities for hierarchical machines
 */

type AnyMachine = { getState(): any };

/**
 * Compute the full hierarchical key for the current active state chain
 * @param machine - Root or any machine in hierarchy
 * @returns Dot-separated key path (e.g., "Parent.Child.GrandChild")
 */
export function getFullKey(machine: AnyMachine): string {
  const chain = getActiveStatePath(machine);
  return chain.map((item) => item.state.key).join(".");
}

/**
 * Get the depth of a specific state in the hierarchy
 * @param machine - Root machine
 * @param state - State to find depth for
 * @returns Depth (0 for root, 1 for first child, etc.)
 */
export function getDepth(machine: AnyMachine, state: any): number {
  const chain = getActiveStatePath(machine);
  const index = chain.findIndex((item) => item.state === state);
  return index >= 0 ? index : 0;
}

/**
 * Get the full active state path with machine references
 * @param machine - Root or any machine in hierarchy
 * @returns Array of {machine, state} objects
 */
export function getActiveStatePath(
  machine: AnyMachine
): Array<{ machine: AnyMachine; state: any }> {
  const chain: Array<{ machine: AnyMachine; state: any }> = [];
  let current: AnyMachine | undefined = machine;
  let guard = 0;
  const MAX_DEPTH = 100;

  while (current && guard++ < MAX_DEPTH) {
    const state: any = current.getState();
    if (!state) {
      break;
    }

    chain.push({ machine: current, state });

    // Look for child machine
    const child: AnyMachine | undefined = state.data?.machine;
    if (!child || typeof child.getState !== "function") {
      break;
    }

    current = child;
  }

  return chain;
}
