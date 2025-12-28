import {
  defineStates,
  matchina
} from "matchina";
import { submachine, createHierarchicalPropagation } from "matchina/hsm";

// 1. Define the Child Machine (Light Cycle)
// We need a factory for the child machine so it can be instantiated freshly
const lightCycleStates = defineStates({
  Red: () => ({}),
  Green: () => ({}),
  Yellow: () => ({})
});

const createLightCycle = () => matchina(
  lightCycleStates,
  {
    Red: { tick: "Green" },
    Green: { tick: "Yellow" },
    Yellow: { tick: "Red" },
  },
  lightCycleStates.Red()
);

// 2. Define the Parent Machine (Controller)
// We use `submachine` to embed the child machine factory
const controllerStates = defineStates({
  Broken: () => ({}),
  Working: submachine(createLightCycle),
  Maintenance: () => ({}),
});

const createController = () => matchina(
  controllerStates,
  {
    Broken: { repair: "Working", maintenance: "Maintenance" },
    Working: { break: "Broken", maintenance: "Maintenance" },
    Maintenance: { complete: "Working" },
  },
  controllerStates.Working()
);

// 3. Create the Hierarchical Machine
// This wraps the controller with propagation logic
export function createPropagatingTrafficLight() {
  const root = createController();
  return createHierarchicalPropagation(root);
}
