import { zen } from "./extras/zen";
import { StateFactory } from "./state";
import {
  createMachine,
  FactoryMachineContext,
  FactoryMachineTransitions,
  FactoryState
} from "./factory-machine";
import { KeysWithZeroRequiredArgs } from "./utility-types";

export function matchina<
  SF extends StateFactory,
  TC extends FactoryMachineTransitions<SF>,
  FC extends FactoryMachineContext<SF> = { states: SF; transitions: TC },
>(
  states: SF,
  transitions: TC,
  init: KeysWithZeroRequiredArgs<FC["states"]> | FactoryState<FC["states"]>,
) {
  return zen(createMachine(states, transitions, init));
}
