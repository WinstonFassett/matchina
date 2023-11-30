import { StateMachinery, createStateMachine } from "./state-machine";
import {
  ChangeCommandEvent,
} from "./types";
import { ResolveEvent } from "./transition-machine";
import { State } from "./types";

export function createFactoryMachine<
  // S extends State,
  SF extends AnyStatesFactory, //StatesFactory<S>,
  TC extends TransitionConfig<SF>,
  E extends FactoryMachineEvent<TC, SF>,
>(
  states: SF,
  transitions: TC,
  initialState: StateFromFactory<SF>,
): FactoryMachine<SF, TC> {
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
  // S extends State,
  SF extends AnyStatesFactory,
  TC extends TransitionConfig<SF>,
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

export type TransitionConfig<
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
  SF extends AnyStatesFactory,
  TC extends TransitionConfig<SF> = TransitionConfig<SF>,
  E extends FactoryMachineEvent<TC, SF> = FactoryMachineEvent<TC, SF>,
> extends StateMachinery<E> {
  states: SF;
  transitions: TC;
}

export type FactoryMachineEvent<
  TC extends TransitionConfig<SF>,
  SF extends AnyStatesFactory,
> = ChangeCommandEvent<
  string & FlatEventKeys<TC>,
  any[],
  StateFromFactory<SF>,
  StateFromFactory<SF>
>;

export type FlatEventKeys<T> = {
  [K in keyof T]: keyof T[K];
}[keyof T];

export type StateFromFactory<
  States extends AnyStatesFactory,
  StateKey extends keyof States = keyof States
> = ReturnType<States[StateKey]>;


export type AnyStatesFactory = Record<string, (...params: any) => State>;

// export type AnyStatesFactory<
//   S extends State = State,
//   F extends (...args: any[]) => State = (...args: any[]) => State
// > = Record<string, (...params: any[]) => State>;

export type StatesFactory<T, F extends (...args: any[]) => T> = {
  [key: string]: (...args: any[]) => T;
};