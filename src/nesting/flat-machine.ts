/**
 * Flat machine creation and flattening
 *
 * createFlatMachine: Primary API for creating flat machines from states and transitions
 * Handles all internal complexity:
 * - Flattens hierarchical structures automatically
 * - Creates the machine
 * - Applies enhancements (parent fallback, child exit)
 * - Attaches static shape for visualization
 */

import type { FactoryMachineTransitions } from "../factory-machine-types";
import type { KeysWithZeroRequiredArgs } from "../utility-types";
import type { StateMatchboxFactory } from "../state-types";
import { createMachine } from "../factory-machine";
import { withParentTransitionFallback } from "./parent-transition-fallback";
import { withFlattenedChildExit } from "./flattened-child-exit";
import { createStaticShapeStore } from "./shape-store";

/**
 * Create a flat machine directly from states and transitions.
 *
 * Handles all internal complexity:
 * - Detects if flattening is needed (dot-notation states)
 * - Flattens hierarchical structures automatically
 * - Creates the machine
 * - Applies enhancements (parent fallback, child exit)
 * - Attaches static shape for visualization
 *
 * This is the recommended API for flat machines.
 */
export function createFlatMachine<
  SF extends StateMatchboxFactory<any>,
  T extends FactoryMachineTransitions<SF>,
  I extends keyof SF & string
>(
  states: SF,
  transitions: T,
  initial: I
) {
  // Create raw machine
  const machine = createMachine(states, transitions, initial);

  // Apply parent transition fallback for flattened machines
  // This allows child states to inherit parent transitions
  withParentTransitionFallback(machine);

  // Apply automatic child.exit triggering for flattened machines
  // When a final child state is reached, automatically send child.exit event
  withFlattenedChildExit(machine);

  // Attach static shape store for visualization and introspection
  // Flattened machines have immutable structure (locked at creation)
  (machine as any).shape = createStaticShapeStore(machine);

  return machine;
}
