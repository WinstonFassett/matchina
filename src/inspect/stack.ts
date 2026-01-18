/**
 * Stack inspection utilities for hierarchical machines
 */

type AnyMachine = { getState(): any };
import { getActiveStatePath } from './state';

/**
 * Get the current active state stack
 * @param machine - Root or any machine in hierarchy
 * @returns Array of states from root to deepest active
 */
export function getStateStack(machine: AnyMachine): any[] {
  const chain = getActiveStatePath(machine);
  return chain.map((item) => item.state);
}
