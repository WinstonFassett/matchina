// Flattened machine creation (primary API for flat hierarchies)
export {
  createFlatMachine
} from "./flat-machine";
export {
  describeHSM,
  createDeclarativeFlatMachine
} from "./declarative-flat";
export type {
  DeclarativeFlatMachineConfig,
  DeclarativeStateConfig
} from "./declarative-flat";
export { parseFlatStateKey } from "./flat-state-utils";

// Hierarchical machine creation (primary API for nested machines)
// Propagation and child-first routing
export { submachine, submachineOptions } from "./submachine";
export { 
  withParentTransitionFallback,
  type ParentTransitionFallbackOptions 
} from "./parent-transition-fallback";
export { 
  withFlattenedChildExit,
  type FlattenedChildExitOptions 
} from "./flattened-child-exit";
export { 
  propagateSubmachines, 
  makeHierarchicalMachine,
  createHierarchicalMachine,
  type HierarchicalMachine,
  type HierarchicalEvents 
} from "./propagateSubmachines";
export type { 
  StatesOf, 
  EventsOf, 
  AllEventsOf, 
  ChildOf, 
  ActiveEvents 
} from "./types";
export { sendWhen } from "./types";

// Inspection utilities
export { 
  inspect, 
  getFullKey, 
  getDepth, 
  getStack, 
  getActiveChain 
} from "./inspect";

// Shape types and utilities
export type { 
  MachineShape, 
  StateNode, 
  ShapeController 
} from "./shape-types";
export {
  createStaticShapeStore,
  createLazyShapeStore
} from "./shape-store";
