/**
 * Inspection utilities for hierarchical machines
 *
 * These utilities walk the machine hierarchy on-demand to compute
 * inspection data (fullKey, depth, stack) without mutating states.
 */

type AnyMachine = { getState(): any };

/**
 * Compute the full hierarchical key for the current active state chain
 * @param machine - Root or any machine in hierarchy
 * @returns Dot-separated key path (e.g., "Parent.Child.GrandChild")
 */
export function getFullKey(machine: AnyMachine): string {
  const chain = getActiveChain(machine);
  return chain.map(item => item.state.key).join('.');
}

/**
 * Get the depth of a specific state in the hierarchy
 * @param machine - Root machine
 * @param state - State to find depth for
 * @returns Depth (0 for root, 1 for first child, etc.)
 */
export function getDepth(machine: AnyMachine, state: any): number {
  const chain = getActiveChain(machine);
  const index = chain.findIndex(item => item.state === state);
  return index >= 0 ? index : 0;
}

/**
 * Get the current active state stack
 * @param machine - Root or any machine in hierarchy
 * @returns Array of states from root to deepest active
 */
export function getStack(machine: AnyMachine): any[] {
  const chain = getActiveChain(machine);
  return chain.map(item => item.state);
}

/**
 * Get the full active chain with machine references
 * @param machine - Root or any machine in hierarchy
 * @returns Array of {machine, state} objects
 */
export function getActiveChain(machine: AnyMachine): Array<{ machine: AnyMachine; state: any }> {
  const chain: Array<{ machine: AnyMachine; state: any }> = [];
  let current: AnyMachine | undefined = machine;
  let guard = 0;
  const MAX_DEPTH = 100;

  while (current && guard++ < MAX_DEPTH) {
    const state = current.getState();
    if (!state) break;

    chain.push({ machine: current, state });

    // Look for child machine
    const child = state.data?.machine;
    if (!child || typeof child.getState !== 'function') break;

    current = child;
  }

  return chain;
}

/**
 * Create a snapshot of the current hierarchy state
 * @param machine - Root machine
 * @returns Snapshot with fullKey, depth, stack, state
 */
export function inspect(machine: AnyMachine) {
  const chain = getActiveChain(machine);
  const fullKey = chain.map(item => item.state.key).join('.');
  const state = chain[chain.length - 1]?.state;
  const depth = chain.length - 1;
  const stack = chain.map(item => item.state);

  return {
    fullKey,
    depth,
    stack,
    state,
    machine,
    chain,
  };
}
