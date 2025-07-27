import { FactoryMachineEventImpl } from "./factory-machine-event";
import { FactoryMachine, FactoryMachineContext, FactoryMachineEvent, FactoryMachineTransition, FactoryMachineTransitions, FactoryState } from "./factory-machine-types";
import { StateFactory } from "./state";
import { ResolveEvent } from "./state-machine-types";
import { createTransitionMachine } from "./transition-machine";
import { KeysWithZeroRequiredArgs } from "./utility-types";

export function createMachine<
  SF extends StateFactory,
  TC extends FactoryMachineTransitions<SF>,
  FC extends FactoryMachineContext<SF> = { states: SF; transitions: TC },
  E extends FactoryMachineEvent<FC> = FactoryMachineEvent<FC>,
>(
  states: SF,
  transitions: TC,
  init: KeysWithZeroRequiredArgs<FC["states"]> | FactoryState<FC["states"]>,
): FactoryMachine<FC> {
  // Fix type for initialState to match createTransitionMachine's expectation
  const initialState = typeof init === "string" ? states[init]({}) : (init as ReturnType<SF[keyof SF]>);
  
  return Object.assign(
    createTransitionMachine<E>(
      transitions as any, 
      // Explicit cast to E['from'] to satisfy createTransitionMachine's type
      initialState as E['from']
    ), {
    states,
    resolveExit: (ev: ResolveEvent<E>): E | undefined => {
      const to = resolveNextState<FC>(transitions, states, ev);
      return to ? new FactoryMachineEventImpl<E>(ev.type, ev.from, to, ev.params) as E : undefined;
    },
  }) as any;
}

export function resolveNextState<FC extends FactoryMachineContext<any>>(
  transitions: FC["transitions"],
  states: FC["states"],
  ev: ResolveEvent<FactoryMachineEvent<FC>>,
) {
  const transition = transitions[ev.from.key]?.[ev.type];
  return resolveExitState(transition, ev, states);
}

export function resolveExitState<FC extends FactoryMachineContext<any>>(
  transition: FactoryMachineTransition<FC["states"]> | undefined,
  ev: ResolveEvent<FactoryMachineEvent<FC>>,
  states: FC["states"],
) {
  if (!transition) {
    return undefined
  }
  if (typeof transition === "function") {
    const stateOrFn = transition(...ev.params);
    return typeof stateOrFn === "function" ? (stateOrFn as any)(ev) : stateOrFn;
  }
  return states[transition as keyof typeof states](...ev.params) as any;
}
