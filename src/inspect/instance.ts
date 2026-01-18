/**
 * Machine instance inspection utilities
 */

type AnyMachine = { getState(): any };
import { getActiveStatePath } from './state';

/**
 * Create a snapshot of the current hierarchy state
 * @param machine - Root machine
 * @returns Snapshot with fullKey, depth, stack, state
 */
export function inspect(machine: AnyMachine) {
  const chain = getActiveStatePath(machine);
  const fullKey = chain.map((item) => item.state.key).join(".");
  const state = chain.at(-1)?.state;
  const depth = chain.length - 1;
  const stack = chain.map((item) => item.state);

  return {
    fullKey,
    depth,
    stack,
    state,
    machine,
    chain,
  };
}

/**
 * Get machine instance from state (identity function for now)
 * @param machine - Machine instance
 * @returns Same machine instance
 */
export function getMachineInstance(machine: AnyMachine): AnyMachine {
  return machine;
}
