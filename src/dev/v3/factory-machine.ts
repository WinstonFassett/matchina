import { createStateMachine } from "./state-machine";
import {
  AnyStatesFactory,
  ChangeCommandEvent,
  StateFromFactory
} from "./types";


export function createFactoryMachine<
  SF extends AnyStatesFactory,
  TC extends FactoryTransitionConfig<SF>,
  E extends ChangeCommandEvent<
    string & FlatEventKeys<TC>,
    any[],
    StateFromFactory<SF>,
    StateFromFactory<SF>
  >,
>(states: SF, transitions: TC, initialState: StateFromFactory<SF>) {
  const machine = createStateMachine<E>(transitions, initialState);  
  return Object.assign(machine, {
    states,
    resolve (ev: E) {
      const to = nextFactoryState(transitions, states, ev);
      if (to) return { ...ev, to } as E;
    }
  })
}

export type FactoryTransitionConfig<
  SF extends AnyStatesFactory,
  CP extends any[] = any[],
> = {
  [FromStateKey in string & keyof SF]: {
    [EventKey in string]:
      | keyof SF
      | ((...params: any[]) => StateFromFactory<SF>)
      | ((...params: any[]) => (...context: CP) => StateFromFactory<SF>);
  };
};

export function nextFactoryState<
  SF extends AnyStatesFactory,
  TC extends FactoryTransitionConfig<SF>,
>(
  transitions: TC,
  states: SF,
  ev: ChangeCommandEvent,
) {
  const to = transitions[ev.from.key][ev.type];
  if (!to) return undefined;
  if (typeof to === "function") {
    const stateOrFn = to(...ev.params);
    return typeof stateOrFn === "function"
      ? stateOrFn(ev.from, ev.type, states, transitions)
      : stateOrFn;
  } else {
    return states[to as keyof typeof states](...ev.params) as any;
  }
}

export type FlatEventKeys<T> = {
  [K in keyof T]: keyof T[K];
}[keyof T];

