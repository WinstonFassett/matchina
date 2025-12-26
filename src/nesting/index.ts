export { submachine, submachineOptions } from "./submachine";
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
