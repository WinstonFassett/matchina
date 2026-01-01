// Inspection utilities for building shape trees
export { 
  buildShapeTree,
  getActiveStatePath
} from "./build-visualizer-tree";

// Re-export HSM inspection utilities for convenience
export { 
  inspect, 
  getFullKey, 
  getDepth, 
  getStack, 
  getActiveChain 
} from "../hsm/inspect";

// Re-export shape types for visualization
export type { 
  MachineShape, 
  StateNode, 
  ShapeController 
} from "../hsm/shape-types";
