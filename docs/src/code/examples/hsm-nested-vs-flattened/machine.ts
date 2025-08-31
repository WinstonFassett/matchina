import { 
  createMachine, 
  defineStates, 
  setup 
} from "matchina";
import { 
  defineMachine, 
  defineSubmachine, 
  flattenMachineDefinition, 
  createMachineFromFlat
} from "../../../../../src/definitions";
import { propagateSubmachines } from "../../../../../src/nesting/propagateSubmachines";
import { submachine } from "../../../../../src/nesting/submachine";
import { createHierarchicalMachine } from "../../../../../src/nesting/propagateSubmachines";

// === NESTED APPROACH ===
// Child machines exist as separate instances within parent states

function createTrafficLight() {
  const states = defineStates({ Red: undefined, Green: undefined, Yellow: undefined });
  return createMachine(
    states,
    {
      Red: { tick: "Green" },
      Green: { tick: "Yellow" }, 
      Yellow: { tick: "Red" },
    },
    "Red"
  );
}

export function createNestedController() {
  const states = defineStates({
    Broken: undefined,
    Working: submachine(() => createTrafficLight()), // Child created on demand
    Maintenance: undefined,
  });

  const ctrl = createMachine(
    states,
    {
      Broken: { repair: "Working", maintenance: "Maintenance" },
      Working: { break: "Broken", maintenance: "Maintenance" },
      Maintenance: { complete: "Working" },
    },
    "Working"
  );

  setup(ctrl)(propagateSubmachines(ctrl));
  
  // Return with hierarchical machine for child event routing
  const hierarchical = createHierarchicalMachine(ctrl);
  return Object.assign(hierarchical, { nested: ctrl });
}

// === FLATTENED APPROACH ===  
// All states exist at the same level with dot-notation hierarchical keys

export function createFlattenedController() {
  // Define hierarchical structure using defineSubmachine
  const ctrlDef = defineMachine(
    defineStates({
      Broken: undefined,
      Working: defineSubmachine(
        defineStates({ Red: undefined, Green: undefined, Yellow: undefined }),
        {
          Red: { tick: "Green" },
          Green: { tick: "Yellow" },
          Yellow: { tick: "Red" },
        },
        "Red"
      ),
      Maintenance: undefined,
    }),
    {
      Broken: { repair: "Working", maintenance: "Maintenance" },
      Working: { break: "Broken", maintenance: "Maintenance" },
      Maintenance: { complete: "Working" },
    },
    "Working"
  );
  
  // Flatten the definition and create machine
  const flat = flattenMachineDefinition(ctrlDef);
  return createMachineFromFlat(flat);
}

// === COMPARISON HELPERS ===

export function getStateDisplay(machine: any) {
  const state = machine.getState();
  if (state.data?.machine) {
    // Nested: show both parent and child states
    return `${state.key} -> ${state.data.machine.getState().key}`;
  }
  // Flattened: single key (may be dot-notated)
  return state.key;
}

export function getAvailableTransitions(machine: any) {
  const state = machine.getState();
  const transitions = machine.transitions[state.key];
  return transitions ? Object.keys(transitions) : [];
}