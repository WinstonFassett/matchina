import { StateMachinery, createStateMachine } from "./state-machine";
import {
  ChangeCommandEvent,
} from "./types";
import { ResolveEvent } from "./transition-machine";
import { State } from "./types";

export function createFactoryMachine<
  SF extends AnyStatesFactory,
  TC extends FactoryTransitionConfig<SF>,
  E extends FactoryMachineEvent<TC, SF>,
>(
  states: SF,
  transitions: TC,
  initialState: StateFromFactory<SF>,
): FactoryMachine<TC, SF> {
  const machine = createStateMachine<E>(transitions, initialState);
  Object.assign(machine, {
    states,
    resolve: (ev: ResolveEvent<E>): E | undefined => {
      const to = nextFactoryState(transitions, states, ev);
      if (to) return { ...ev, to };
    },
  });
  return machine as any;
}

export function nextFactoryState<
  SF extends AnyStatesFactory,
  TC extends FactoryTransitionConfig<SF>,
>(transitions: TC, states: SF, ev: ChangeCommandEvent) {
  const to = transitions[ev.from.key][ev.type];
  if (!to) return undefined;
  if (typeof to === "function") {
    const stateOrFn = to(...ev.params);
    return typeof stateOrFn === "function"
      ? stateOrFn(ev)
      : stateOrFn;
  } else {
    return states[to as keyof typeof states](...ev.params) as any;
  }
}

export type FactoryTransitionConfig<
  SF extends AnyStatesFactory,
> = {
  [FromStateKey in string & keyof SF]: {
    [EventKey in string]:
      | keyof SF
      | ((...params: any[]) => StateFromFactory<SF>)
      | ((...params: any[]) => (ev: FactoryMachineEvent<any,SF> & { from: StateFromFactory<SF, FromStateKey> }) => StateFromFactory<SF>);
  };
};

export interface FactoryMachine<
  TC extends FactoryTransitionConfig<SF>,
  SF extends AnyStatesFactory,
  E extends FactoryMachineEvent<TC, SF> = FactoryMachineEvent<TC, SF>,
> extends StateMachinery<E> {
  states: SF;
  transitions: TC;
}

type FactoryMachineEvent<
  TC extends FactoryTransitionConfig<SF>,
  SF extends AnyStatesFactory,
> = {
  type: string & FlatEventKeys<TC>;
  to: StateFromFactory<SF>;
  from: StateFromFactory<SF>;
  params: any[];
};

export type FlatEventKeys<T> = {
  [K in keyof T]: keyof T[K];
}[keyof T];export type StateFromFactory<
  States extends AnyStatesFactory,
  StateKey extends keyof States = keyof States
> = ReturnType<States[StateKey]>;
export type AnyStatesFactory = Record<string, (...params: any[]) => State>;

