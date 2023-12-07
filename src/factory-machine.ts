import { StateMachinery, createStateMachine } from "./state-machine";
import { ResolveEvent } from "./transition-machine";
import { ChangeCommandEvent, State } from "./types";

export function createFactoryMachine<
  SF extends AnyStatesFactory,
  TC extends TransitionConfig<SF>,
  E extends FactoryMachineEvent<TC, SF>,
  // I extends StateFromFactory<SF>
>(
  states: SF,
  transitions: TC,
  // initialState: StateFromFactory<SF>,
  init: KeysWithZeroArgs<SF> | StateFromFactory<SF>,
  // FunctionWithParameters<T> extends true
  //     ? { key: string }
  //     : keyof T | undefined
): FactoryMachine<SF, TC> {
  const initialState = (
    typeof init === "string" ? states[init]({}) : init
  ) as StateFromFactory<SF>;
  const machine = createStateMachine<E>(transitions, initialState);
  Object.assign(machine, {
    states,
    resolve: (ev: ResolveEvent<E>): E | undefined => {
      const to = nextFactoryState(transitions, states, ev);
      if (to) {
        return { ...ev, to } as E;
      }
    },
  });
  return machine as any;
}

type FunctionWithParameters<F> = F extends (...args: infer Args) => any
  ? Args extends []
    ? false
    : true
  : false;

type KeysWithZeroArgs<T> = {
  [K in keyof T]: FunctionWithParameters<T[K]> extends true ? never : K;
}[keyof T];

export function nextFactoryState<
  SF extends AnyStatesFactory,
  TC extends TransitionConfig<SF>,
>(transitions: TC, states: SF, ev: ResolveEvent<FactoryMachineEvent<TC, SF>>) {
  const to = transitions[ev.from.key][ev.type];
  if (!to) {
    return undefined;
  }
  if (typeof to === "function") {
    const stateOrFn = to(...ev.params);
    return typeof stateOrFn === "function" ? stateOrFn(ev) : stateOrFn;
  } else {
    return states[to as keyof typeof states](...ev.params) as any;
  }
}

export type TransitionConfig<SF extends AnyStatesFactory> = {
  [FromStateKey in string & keyof SF]: {
    [EventKey in string]:
      | keyof SF
      | ((...params: any[]) => StateFromFactory<SF>)
      | ((...params: any[]) => (
          ev: ResolveEvent<FactoryMachineEvent<any, SF>> & {
            from: StateFromFactory<SF, FromStateKey>;
          },
        ) => StateFromFactory<SF>);
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
  StateKey extends keyof States = keyof States,
> = ReturnType<States[StateKey]>;

export type AnyStatesFactory = Record<string, (...params: any) => State>;

export type StatesFactory<T> = {
  [key: string]: (...args: any[]) => T;
};
