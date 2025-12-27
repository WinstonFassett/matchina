/**
 * Shape store creation and management
 *
 * Shape stores are lightweight subscribers to machine structure changes.
 * For flattened machines, they're completely static.
 */

import type { FactoryMachine } from "../factory-machine";
import type { MachineShape, ShapeController } from "./shape-types";
import { buildFlattenedShape } from "./shape-builders";

/**
 * Create a static shape store for flattened machines
 *
 * The shape is computed once and never changes, but still provides
 * the subscribe interface for consistency with potential future store types.
 */
export function createStaticShapeStore(machine: FactoryMachine<any>): ShapeController {
  const shape = buildFlattenedShape(
    machine.transitions as Record<string, Record<string, any>>,
    (machine as any).initialKey as string
  );
  const subscribers = new Set<(shape: MachineShape) => void>();

  return {
    getState(): MachineShape {
      return shape;
    },

    subscribe(callback: (shape: MachineShape) => void): () => void {
      subscribers.add(callback);
      return () => {
        subscribers.delete(callback);
      };
    },

    notify(data: any): void {
      // For static stores, this is a no-op
    },
  };
}
