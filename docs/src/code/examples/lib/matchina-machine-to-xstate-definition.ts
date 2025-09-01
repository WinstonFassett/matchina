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
  const definition = {
    initial: initialState.key,
    states: {} as any,
  };
  
  // Build states from transitions - this gives us the complete structure
  if (machine.transitions) {
    Object.entries(machine.transitions as object).forEach(([fromKey, events]) => {
      if (!definition.states[fromKey]) {
        definition.states[fromKey] = { on: {} };
      }
      
      Object.entries(events as object).forEach(([event, transition]) => {
        if (typeof transition === 'object' && 'to' in transition) {
          const targetKey = transition.to as string;
          
          // Add target state if not exists
          if (!definition.states[targetKey]) {
            definition.states[targetKey] = { on: {} };
          }
          
          // Add transition
          definition.states[fromKey].on[event] = targetKey;
        }
      });
    });
  }
  
  // Check current state for nested machine - this is the single right way
  try {
    const currentState = machine.getState();
    if (currentState?.data?.machine) {
      const childMachine = currentState.data.machine;
      if (childMachine && typeof childMachine.getState === 'function' && childMachine.transitions) {
        const childDefinition = getXStateDefinition(childMachine);
        if (!definition.states[currentState.key]) {
          definition.states[currentState.key] = { on: {} };
        }
        definition.states[currentState.key].initial = childDefinition.initial;
        definition.states[currentState.key].states = childDefinition.states;
      }
    }
  } catch (e) {
    // Don't break if nested machine inspection fails
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
