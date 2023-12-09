import { createApi } from "./factory-event-api";
import {
  FactoryMachineTransitions,
  StateFromFactory,
  createFactoryMachine,
} from "./factory-machine";
import { UnionSpec } from "./matchbox";
import { States, defineStates } from "./states";

export function matchina<
  S extends UnionSpec,
  T extends FactoryMachineTransitions<States<S>>,
>(
  stateConfig: S,
  transitionConfig: T | ((states: States<S>) => T),
  init:
    | StateFromFactory<States<S>>
    | ((states: States<S>, transitions: T) => StateFromFactory<States<S>>),
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
  // return api
  // return {
  //   ...api,
  // }
}
