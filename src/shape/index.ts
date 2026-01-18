/**
 * Shape analysis module exports
 */

// Machine interfaces
export type { MachineDescriptor } from './machine';
export { isMachineDescriptor, createDescriptorFromMachine } from './machine';

// Shape builders
export {
  buildFlattenedShape,
  buildMachineStructure,
  buildHierarchicalShape
} from './builders';

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
export type { FactoryMachineWithShape } from './augmented';
export { hasShape, enhanceWithShape } from './augmented';
