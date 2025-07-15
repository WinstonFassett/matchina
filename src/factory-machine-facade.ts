import { createApi } from "./factory-machine-event-api";
import {
  FactoryMachineTransitions,
  FactoryState,
  createMachine,
} from "./factory-machine";
import { SpecRecord } from "./matchbox-factory";
import { States, defineStates } from "./define-states";
import { KeysWithZeroArgs } from "./utility-types";

export function facade<
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
  const machine = createMachine(states, transitions, initialState);
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
