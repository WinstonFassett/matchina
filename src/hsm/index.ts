// Flattened hierarchy approach (primary API)
export { createHSM as createHSM } from "./flattened/declarative-flat";
export type {
  DeclarativeFlatMachineConfig,
  DeclarativeStateConfig
} from "./flattened/types";
export { createFlatMachine } from "./flattened/declarative-flat";
export { parseFlatStateKey } from "./flattened/flat-state-utils";

// Nested hierarchy approach (escape hatch)
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
export { submachine } from "./nested/submachine";
export { sendWhen } from "./utility-types";
export type {
  ActiveEvents, AllEventsOf,
  ChildOf, EventsOf, StatesOf
} from "./utility-types";


