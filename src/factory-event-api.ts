import { FlatMemberUnionToIntersection, Simplify } from "./utility-types";
import {
  AnyStatesFactory,
  FactoryMachine,
  TransitionConfig,
  StateFromFactory,
} from "./factory-machine";

export function createApi<
  SF extends AnyStatesFactory,
  TC extends TransitionConfig<SF>,
>(machine: FactoryMachine<SF, TC>): FactoryMachineApi<TC, SF> {
  const { states, transitions } = machine;
  const createSender =
    (eventKey: any) =>
    (...params: any[]) => {
      return machine.send(eventKey, ...(params as any));
    };

  const transitioners: any = {};
  const events: any = {};
  for (const stateKey in states) {
    const transitionKey = stateKey as keyof typeof transitions;
    const stateTransitions = transitions[transitionKey];
    transitioners[transitionKey] = {};
    if (stateTransitions) {
      for (const eventKey in stateTransitions) {
        const sender = createSender(eventKey);
        transitioners[transitionKey][eventKey] = sender;
        events[eventKey] ||= sender;
      }
    }
  }
  return events;
}

type FactoryMachineApi<
  T extends TransitionConfig<S>,
  S extends AnyStatesFactory,
> = object &
  // Simplify<
  FlatEventSenders<T, S>;
// >;

type WithApi<
  T extends TransitionConfig<S>,
  S extends AnyStatesFactory,
  M,
> = M & {
  api: FactoryMachineApi<T, S>;
};

export function withApi<M extends FactoryMachine<any, any, any>>(target: M) {
  const enhanced = target as WithApi<M["transitions"], M["states"], M>;
  if (enhanced.api) {
    return enhanced;
  }
  return Object.assign(target, {
    api: createApi<M["states"], M["transitions"]>(enhanced),
  }) as WithApi<M["transitions"], M["states"], M>;
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
    ? // if state key
      (
        ...args: Parameters<States[Transitions[TransitionStateKey][EventKey]]>
      ) => StateFromFactory<States, Transitions[TransitionStateKey][EventKey]>
    : Transitions[TransitionStateKey][EventKey] extends (
        ...args: infer A
      ) => (...innerArgs: any[]) => infer R
    ? // if 2-stage function
      (...args: A) => R
    : // if 1-stage function
    Transitions[TransitionStateKey][EventKey] extends (
        ...args: any[]
      ) => StateFromFactory<States>
    ? (
        ...args: Parameters<Transitions[TransitionStateKey][EventKey]>
      ) => StateFromFactory<States> & {
        key: Transitions[TransitionStateKey][EventKey];
      }
    : never;
};
