import {
  defineStates,
  defineMachine,
  defineSubmachine,
  flattenMachineDefinition,
  createMachineFromFlat
} from "matchina";

// Define the nested light cycle as a submachine
const lightCycle = defineSubmachine(
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

// Define the controller with Working state containing the light cycle
const controllerDef = defineMachine(
  defineStates({
    Broken: undefined,
    Working: lightCycle,
    Maintenance: undefined,
  }),
  {
    Broken: { repair: "Working", maintenance: "Maintenance" },
    Working: { break: "Broken", maintenance: "Maintenance" },
    Maintenance: { complete: "Working" },
  },
  "Working"
);

// Flatten and create the machine
const flatDef = flattenMachineDefinition(controllerDef);

export function createFlatTrafficLight() {
  return createMachineFromFlat(flatDef);
}

// Helper to parse hierarchical state key
export function parseFlatStateKey(key: string) {
  const parts = key.split(".");
  return {
    parent: parts[0],
    child: parts[1] || null,
    full: key,
  };
}
