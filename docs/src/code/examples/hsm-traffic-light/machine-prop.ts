import {
  defineStates,
  defineMachine,
  submachine,
  createHierarchicalMachine,
  createMachine
} from "matchina";

// 1. Define the Child Machine (Light Cycle)
// We need a factory for the child machine so it can be instantiated freshly
const createLightCycle = () => createMachine(
  defineStates({ 
    Red: undefined, 
    Green: undefined, 
    Yellow: undefined 
  }),
  {
    Red: { tick: "Green" },
    Green: { tick: "Yellow" },
    Yellow: { tick: "Red" },
  },
  "Red"
);

// 2. Define the Parent Machine (Controller)
// We use `submachine` to embed the child machine factory
const createController = () => createMachine(
  defineStates({
    Broken: undefined,
    Working: submachine(createLightCycle),
    Maintenance: undefined,
  }),
  {
    Broken: { repair: "Working", maintenance: "Maintenance" },
    Working: { break: "Broken", maintenance: "Maintenance" },
    Maintenance: { complete: "Working" },
  },
  "Working"
);

// 3. Create the Hierarchical Machine
// This wraps the controller with propagation logic
export function createPropagatingTrafficLight() {
  const root = createController();
  return createHierarchicalMachine(root);
}
