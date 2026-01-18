/**
 * Shape analysis module exports
 */

// Shape builders
export { buildFlattenedShape, buildMachineStructure } from './builders';

// Shape types and definitions
export type { MachineShape, StateNode, ShapeController } from './definition';

// Hierarchy utilities
export {
  getMachineHierarchy,
  getParentStates,
  isChildState,
  getRootStates,
  getChildStates
} from './hierarchy';

// Shape store creation utilities
export { createStaticShapeStore, createLazyShapeStore } from './store';

// Machine augmentation utilities
export { FactoryMachineWithShape, hasShape, enhanceWithShape } from './augmented';
