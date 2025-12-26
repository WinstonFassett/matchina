import {
  createMachine,
  defineStates
} from "matchina";
import {
  defineMachine,
  defineSubmachine,
  flattenMachineDefinition,
  createMachineFromFlat
} from "../../../../../src/definitions";
import { submachine } from "../../../../../src/nesting/submachine";
import { createHierarchicalMachine } from "../../../../../src/nesting/propagateSubmachines";

// === NESTED APPROACH ===
// Child machines exist as separate instances within parent states


const lightStates = defineStates({ Red: undefined, Green: undefined, Yellow: undefined });

export function createNestedController() {
  const states = defineStates({
    Broken: undefined,
    Working: submachine(() => // Child created on demand
      createMachine(
        lightStates,
        {
          Red: { tick: "Green" },
          Green: { tick: "Yellow" },
          Yellow: { tick: "Red" },
        },
        "Red"
      )
    ), 
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

  // setup(ctrl)(propagateSubmachines);
  
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
  // Walk down into nested machines (state.data.machine) until we reach the deepest
  // child. Collect transitions at each level so we can present child-first ordering.
  const levels: string[][] = [];
  let cur: any = machine;
  while (cur) {
    const st = cur.getState();
    const t = cur.transitions && cur.transitions[st.key]
      ? Object.keys(cur.transitions[st.key])
      : [];
    levels.push(t);

    // descend if this state's data contains a nested machine instance
    const next = st.data?.machine;
    if (next) {
      cur = next;
      continue;
    }
    break;
  }

  // Merge transitions starting from deepest child to outer parent, deduping while
  // preserving first-seen order (child-first).
  const merged: string[] = [];
  for (let i = levels.length - 1; i >= 0; i--) {
    for (const ev of levels[i]) {
      if (merged.indexOf(ev) === -1) merged.push(ev);
    }
  }
  return merged;
}