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
