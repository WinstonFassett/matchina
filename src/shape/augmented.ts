/**
 * Augmented machine interfaces with shape support
 * 
 * These interfaces extend core machine types with shape capabilities
 * without creating circular dependencies.
 */

import type { FactoryMachine } from "../factory-machine";
import type { FactoryKeyedState, KeyedStateFactory } from "../state-keyed";
import type { ShapeController } from "./definition";

// Define types locally to avoid circular dependency
export type FactoryMachineTransitions<SF extends KeyedStateFactory> = {
  [FromStateKey in keyof SF]?: {
    [EventKey in string]?: any;
  };
};

export interface FactoryMachineContext<
  SF extends KeyedStateFactory = KeyedStateFactory,
> {
  states: SF;
  transitions: FactoryMachineTransitions<SF>;
}

/**
 * FactoryMachine with shape support
 * Used for machines that have been enhanced with shape visualization
 */
export interface FactoryMachineWithShape<
  FC extends FactoryMachineContext<any> = FactoryMachineContext,
> extends Omit<FactoryMachine<FC>, "shape"> {
  /**
   * Shape controller for visualization and introspection
   */
  readonly shape: ShapeController;
}

/**
 * Type guard to check if a machine has shape support
 */
export function hasShape(machine: any): machine is FactoryMachineWithShape {
  return machine && typeof machine.shape === 'object' && machine.shape !== null;
}

/**
 * Enhance a machine with shape support
 * This is the proper way to add shape to machines without circular dependencies
 */
export function enhanceWithShape<T extends FactoryMachine<any>>(
  machine: T,
  shapeStore: ShapeController
): T & { readonly shape: ShapeController } {
  const enhanced = machine as any;
  Object.defineProperty(enhanced, "shape", {
    value: shapeStore,
    enumerable: false,
    configurable: true,
    writable: true,
  });
  return enhanced;
}
