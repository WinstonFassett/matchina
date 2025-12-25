/**
 * Hierarchical State Machine (HSM) APIs
 * 
 * This module exports APIs for creating hierarchical/nested state machines.
 * 
 * **Primary approach: Flattening**
 * - Static, compile-time hierarchy
 * - Single machine instance with dot-separated state keys (e.g., "Working.Red")
 * - Simpler mental model, better type inference
 * 
 * **Escape hatch: Propagation**
 * - Dynamic, runtime hierarchy
 * - Multiple machine instances with event bubbling
 * - Use when you need loose composition of independent machines
 * 
 * @example
 * ```typescript
 * import { defineMachine, defineSubmachine, flattenMachineDefinition, createMachineFromFlat } from 'matchina/hsm';
 * 
 * // Define nested machine
 * const trafficLight = defineMachine(
 *   {
 *     Working: defineSubmachine(
 *       { Red: {}, Yellow: {}, Green: {} },
 *       { Red: { timer: 'Green' }, Green: { timer: 'Yellow' }, Yellow: { timer: 'Red' } },
 *       'Red'
 *     ),
 *     Broken: {}
 *   },
 *   { Working: { break: 'Broken' }, Broken: { fix: 'Working' } },
 *   'Working'
 * );
 * 
 * // Flatten and create machine
 * const flat = flattenMachineDefinition(trafficLight);
 * const machine = createMachineFromFlat(flat);
 * // machine.getState().key === "Working.Red"
 * ```
 */

// Primary: Flattening APIs
export {
  defineMachine,
  defineSubmachine,
  flattenMachineDefinition,
  createMachineFrom,
  createMachineFromFlat,
} from './definitions';

export type {
  MachineDefinition,
  FlattenedMachineDefinition,
  FlattenOptions,
} from './definition-types';

// Inspection utilities
export {
  getFullKey,
  getDepth,
  getStack,
  getActiveChain,
  inspect,
} from './nesting/inspect';

// Submachine helper
export { submachine, submachineOptions } from './nesting/submachine';

// Escape hatch: Propagation (experimental)
export {
  propagateSubmachines,
  createHierarchicalMachine,
} from './nesting/propagateSubmachines';

export type {
  HierarchicalMachine,
  HierarchicalEvents,
} from './nesting/propagateSubmachines';
