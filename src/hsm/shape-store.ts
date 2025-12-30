/**
 * Shape store creation and management
 *
 * Shape stores are lightweight subscribers to machine structure changes.
 * For flattened machines, they're completely static (computed once).
 * For hierarchical machines, they're lazy-computed on first access.
 */

import type { FactoryMachine } from "../factory-machine";
import type { MachineShape, ShapeController } from "./shape-types";
import { buildFlattenedShape, buildHierarchicalShape } from "./shape-builders";

/**
 * Create a static shape store for flattened machines
 *
 * The shape is computed once at creation and never changes,
 * but still provides the subscribe interface for consistency.
 */
export function createStaticShapeStore(machine: FactoryMachine<any>): ShapeController {
  const machineWithInitial = machine as { initialKey?: string };
  const shape = buildFlattenedShape(
    machine.transitions as Record<string, Record<string, any>>,
    machineWithInitial.initialKey as string
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
      // For static stores, this is a no-op (shape never changes)
    },
  };
}

/**
 * Create a lazy shape store for hierarchical machines
 *
 * Shape is computed on first access via buildHierarchicalShape.
 * Hierarchical machines can have dynamic shapes if submachines change,
 * but for most cases the shape is stable and we compute it lazily.
 */
export function createLazyShapeStore(machine: FactoryMachine<any>): ShapeController {
  let cachedShape: MachineShape | null = null;
  const subscribers = new Set<(shape: MachineShape) => void>();

  function buildShape(): MachineShape {
    if (cachedShape) return cachedShape;
    cachedShape = buildHierarchicalShape(machine);
    return cachedShape;
  }

  return {
    getState(): MachineShape {
      return buildShape();
    },

    subscribe(callback: (shape: MachineShape) => void): () => void {
      subscribers.add(callback);
      return () => {
        subscribers.delete(callback);
      };
    },

    notify(data: any): void {
      // On hierarchy change, invalidate cache and notify
      cachedShape = null;
      for (const callback of Array.from(subscribers)) {
        callback(buildShape());
      }
    },
  };
}
