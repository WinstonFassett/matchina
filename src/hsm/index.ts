// Flattened machine creation (primary API for flat hierarchies)
export { createHSM as createHSM } from "./flattened/declarative-flat";
export type {
  DeclarativeFlatMachineConfig,
  DeclarativeStateConfig
} from "./flattened/types";
export { createFlatMachine } from "./flattened/declarative-flat";
export { parseFlatStateKey } from "./flattened/flat-state-utils";

// Hierarchical machine creation (primary API for nested machines)
// Propagation and child-first routing
export {
  withFlattenedChildExit,
  type FlattenedChildExitOptions
} from "./flattened/flattened-child-exit";
export {
  withParentTransitionFallback,
  type ParentTransitionFallbackOptions
} from "./flattened/parent-transition-fallback";
export {
  nestedHsmRoot, propagateSubmachines
} from "./nested/propagate-submachines";
export {
  type HierarchicalEvents, type HierarchicalMachine
} from "./nested/types";
export { submachine, submachineOptions } from "./nested/submachine";
export { sendWhen } from "./utility-types";
export type {
  ActiveEvents, AllEventsOf,
  ChildOf, EventsOf, StatesOf
} from "./utility-types";


