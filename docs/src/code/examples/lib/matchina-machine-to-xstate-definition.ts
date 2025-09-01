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
  
  // Build states from transitions using resolveState to ensure string targets
  if (machine.transitions) {
    Object.entries(machine.transitions as object).forEach(([fromKey, events]) => {
      if (!definition.states[fromKey]) {
        definition.states[fromKey] = { on: {} };
      }
      Object.entries(events as object).forEach(([event, entry]) => {
        const resolved = resolveState(machine.states, fromKey, entry).key;
        // Ensure target state bucket exists
        if (!definition.states[resolved]) {
          definition.states[resolved] = { on: {} };
        }
        // Always store a string target (Mermaid-friendly)
        definition.states[fromKey].on[event] = resolved;
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
  // All transitions already normalized above.
  return definition;
}
