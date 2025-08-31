import type { FactoryMachine, StateMatchboxFactory } from "matchina";
import { getStateValues, resolveState } from "./state-utils";

function getChildMachine(state: any): FactoryMachine<any> | undefined {
  return state?.data?.machine || state?.machine;
}

function isStateFinal(state: any): boolean {
  return !!state?.data?.final;
}

export function getXStateDefinition<
  F extends FactoryMachine<{
    states: StateMatchboxFactory<any>;
    transitions: any;
  }>,
>(machine: F) {
  const initialState = machine.getState();
  const stateValues = getStateValues(machine.states);
  const definition = {
    initial: initialState.key,
    states: {} as any,
  };
  
  for (const state of stateValues) {
    const childMachine = getChildMachine(state);
    const stateConfig: any = { on: {} };
    
    if (childMachine) {
      // Hierarchical state with nested machine
      const childDefinition = getXStateDefinition(childMachine);
      stateConfig.initial = childDefinition.initial;
      stateConfig.states = childDefinition.states;
    } else if (isStateFinal(state)) {
      // Final state
      stateConfig.type = 'final';
    }
    
    definition.states[state.key] = stateConfig;
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
        if (event === 'child.exit') {
          // Handle hierarchical exit transitions
          definition.states[from].on[event] = {
            target: resolveState(machine.states, from, entry).key,
            // Add metadata for hierarchical transitions
            internal: false
          };
        } else {
          definition.states[from].on[event] = resolveState(
            machine.states,
            from,
            entry
          ).key;
        }
      });
    }
  );
  return definition;
}
