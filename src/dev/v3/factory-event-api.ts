import { Simplify, FlatMemberUnionToIntersection } from "../../types"
import { FactoryMachine, FactoryTransitionConfig as TransitionConfig } from "./factory-machine";
import { AnyStatesFactory, StateFromFactory } from "./types";


type WithApi<
  M extends FactoryMachine<any,any>,    
> = M & {
  api: Simplify<FlatEventSenders<M['transitions'], M['states']>>;
};

export function withApi<
  M extends FactoryMachine<any,any>,
>(
  target: M
) {
  const enhanced = target as WithApi<M>
  if (enhanced.api) return enhanced;
  enhanced.api = {} as any;
  return enhanced
}

export type FlatEventSenders<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
> = FlatMemberUnionToIntersection<
  StateEventTransitionSenders<Transitions, States>
>;

export type StateEventTransitionSenders<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
> = {
  [StateKey in keyof StateEventTransitionFuncs<Transitions, States>]: {
    [EventKey in keyof StateEventTransitionFuncs<
      Transitions,
      States
    >[StateKey]]: (
      ...args: Parameters<
        StateEventTransitionFuncs<Transitions, States>[StateKey][EventKey]
      >
    ) => void;
  };
};

export type StateEventTransitionFuncs<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
> = {
  [TransitionStateKey in keyof Transitions]: StateEventTransitionFunc<
    Transitions,
    States,
    TransitionStateKey
  >;
};

export type StateEventTransitionFunc<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
  TransitionStateKey extends keyof Transitions,
> = {
  [EventKey in keyof Transitions[TransitionStateKey] &
    string]: Transitions[TransitionStateKey][EventKey] extends keyof States
    ? (
        ...args: Parameters<States[Transitions[TransitionStateKey][EventKey]]>
      ) => StateFromFactory<States, Transitions[TransitionStateKey][EventKey]>
    : Transitions[TransitionStateKey][EventKey] extends (
        ...args: infer A
      ) => (...innerArgs: any[]) => infer R
    ? (...args: A) => R
    : Transitions[TransitionStateKey][EventKey] extends (
        ...any: []
      ) => StateFromFactory<States>
    ? (
        ...args: Parameters<Transitions[TransitionStateKey][EventKey]>
      ) => StateFromFactory<States> & {
        key: Transitions[TransitionStateKey][EventKey];
      }
    : never;
};
