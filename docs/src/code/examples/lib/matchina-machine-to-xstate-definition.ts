import type { FactoryMachine, States } from "@lib/src";
import { getStateValues, resolveState } from "./state-utils";


export function getXStateDefinition<
  F extends FactoryMachine<{ states: States<any>; transitions: any; }>
>(machine: F) {
  const initialState = machine.getState();
  const stateValues = getStateValues(machine.states);
  const definition = {
    initial: initialState.key,
    states: {} as any,
    // on: {} as any, 
  };
  for (const state of stateValues) {
    definition.states[state.key] = {
      // ...state,
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
          entry,
        ).key;
      });
    }
  );
  return definition;
}
