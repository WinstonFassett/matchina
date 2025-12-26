import type { FactoryMachine, StateMatchboxFactory } from "matchina";
import { getStateValues, resolveState } from "./state-utils";

export function getXStateDefinition<
  F extends FactoryMachine<{
    states: StateMatchboxFactory<any>;
    transitions: any;
  }>,
>(machine: F, parentKey?: string) {
  // Check if machine has original hierarchical definition (from flattening)
  const originalDef = (machine as any)._originalDef;
  if (originalDef) {
    return buildDefinitionFromOriginal(originalDef, parentKey);
  }
  
  // Fall back to runtime introspection
  type StateStack = { key: string; fullKey: string }[];

  function buildDefinition(
    machine: FactoryMachine<any>,
    parentKey: string | undefined,
    stack: StateStack
  ) {
    const initialState = machine.getState();
    const declaredInitial = (machine as any).initialKey ?? initialState.key;
    const definition = {
      initial: declaredInitial,
      states: {} as Record<string, any>,
    };

    // Initialize states
    const stateValues = getStateValues(machine.states);
    for (const state of stateValues) {
      definition.states[state.key] = {
        on: {} as any,
      };
    }

    // Object.entries(machine.states).forEach(([key, state]) => {
    //   definition.states[key] = {
    //     ...state,
    //     on: {} as any,
    //   }
    // })
    Object.entries(machine.transitions as object).forEach(
      ([from, stateEvents]) => {
        Object.entries(stateEvents as object).forEach(([event, entry]) => {
          definition.states[from].on[event] = resolveState(
            machine.states,
            from,
            entry
          ).key;
        });
      }
    );
    return definition;
  }

  return buildDefinition(machine, parentKey, []);
}

/**
 * Build XState definition from preserved original hierarchical definition.
 * Used when a flattened machine has _originalDef attached.
 */
function buildDefinitionFromOriginal(def: any, parentKey?: string) {
  type StateStack = { key: string; fullKey: string }[];
  
  function buildFromDef(
    states: any,
    transitions: any,
    initial: string,
    parentKey: string | undefined,
    stack: StateStack
  ): any {
    const definition = {
      initial,
      states: {} as Record<string, any>,
    };

    // Process each state
    for (const [key, stateFactory] of Object.entries(states)) {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      definition.states[key] = { key, fullKey, on: {} };
      
      // Check if this state has a nested machine (from defineSubmachine)
      let nestedMachine: any = null;
      try {
        // Try to get the state value to check for nested machine
        if (typeof stateFactory === 'function') {
          const stateValue = (stateFactory as any)();
          nestedMachine = stateValue?.machine || stateValue?.data?.machine;
        }
      } catch (e) {
        // Ignore - not a submachine
      }
      
      if (nestedMachine && nestedMachine.states && nestedMachine.transitions) {
        // Recursively build nested definition
        const childStack = [...stack, { key, fullKey }];
        const childDef = buildFromDef(
          nestedMachine.states,
          nestedMachine.transitions,
          nestedMachine.initial,
          fullKey,
          childStack
        );
        definition.states[key].initial = nestedMachine.initial;
        definition.states[key].states = childDef.states;
        definition.states[key].stack = childStack;
      } else {
        definition.states[key].stack = [...stack, { key, fullKey }];
      }
    }

    // Process transitions
    for (const [fromKey, events] of Object.entries(transitions || {})) {
      if (!definition.states[fromKey]) continue;
      for (const [event, target] of Object.entries(events as any || {})) {
        if (typeof target === 'string') {
          definition.states[fromKey].on[event] = target;
        }
      }
    }

    return definition;
  }

  return buildFromDef(def.states, def.transitions, def.initial, parentKey, []);
}
