import { createApi } from "./factory-machine-event-api";
import {
  FactoryMachineTransitions,
  FactoryState,
  createFactoryMachine,
} from "./factory-machine";
import { SpecRecord } from "./matchbox";
import { States, defineStates } from "./states";
import { KeysWithZeroArgs } from "./utility-types";

export function matchina<
  S extends SpecRecord,
  T extends FactoryMachineTransitions<States<S>>,
>(
  stateConfig: S,
  transitionConfig: T | ((states: States<S>) => T),
  init:
    | KeysWithZeroArgs<States<S>>
    | FactoryState<States<S>>
    | ((states: States<S>, transitions: T) => FactoryState<States<S>>),
) {
  const states = defineStates(stateConfig) as States<S>;
  const transitions =
    typeof transitionConfig === "function"
      ? transitionConfig(states)
      : transitionConfig;
  const initialState =
    typeof init === "function" ? init(states, transitions) : init;
  const machine = createFactoryMachine(states, transitions, initialState);
  const api = createApi(machine);
  return {
    ...api,
    get state() {
      return machine.getState();
    },
    get change() {
      return machine.getChange();
    },
    get machine() {
      return machine;
    },
  };
}
