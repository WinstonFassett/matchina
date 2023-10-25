// @ts-nocheck
/* eslint-disable unicorn/no-abusive-eslint-disable */
/* eslint-disable */

import { StatesFactory } from "../states";
import {
  TransitionConfig,
  FlatMemberUnionToIntersection,
  StateTransitioners,
  StateMachine,
  FlattenReturnStateTargetKeys,
  StateTransitions,
  StateTransitionTargets,
} from "../types";

export type FlattenMemberKeys<T> = {
  [K in keyof T]: keyof T[K];
}[keyof T];

export type Filter<T, K> = {
  [TK in keyof T]: TK extends K ? T[TK] : never;
}[keyof T];

export type FlatEventers<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = FlatMemberUnionToIntersection<StateTransitioners<States, Transitions>>;

export type FlatMachineEventers<
  M extends StateMachine<StatesFactory<any>, any>,
> = FlatEventers<M["def"]["states"], M["def"]["transitions"]>;

// not sure about this one
export type FlatMachineReturnEventToTargetKeyMap<
  M extends StateMachine<StatesFactory<any>, any>,
> = FlatMemberUnionToIntersection<
  FlattenReturnStateTargetKeys<M["def"]["states"], M["def"]["transitions"]>
>;

export type FlatEventTargetsMap<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = {
  [StateKey in keyof StateTransitions<States, Transitions>]: {
    [EventKey in keyof StateTransitions<
      States,
      Transitions
    >[StateKey]]: ReturnType<
      StateTransitions<States, Transitions>[StateKey][EventKey]
    >;
  };
};

export type FlatEventTargets<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = {
  [StateKey in keyof StateTransitions<States, Transitions>]: {
    [EventKey in keyof StateTransitions<
      States,
      Transitions
    >[StateKey]]: ReturnType<
      StateTransitions<States, Transitions>[StateKey][EventKey]
    >;
  };
};

export type FlatMachineEventTargets<
  M extends StateMachine<StatesFactory<any>, any>,
> = FlatMemberUnionToIntersection<
  StateTransitionTargets<M["def"]["states"], M["def"]["transitions"]>
>;

export type FlattenedTargets<T> = {
  [K1 in keyof T]: {
    [K2 in keyof T[K1]]: T[K1][K2];
  };
}[keyof T];

export type FlattenReturnStateTargetTypes<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = ValueTypes<{
  [StateKey in keyof StateTransitions<States, Transitions>]: {
    [EventKey in keyof StateTransitions<
      States,
      Transitions
    >[StateKey]]: StateTransitions<
      States,
      Transitions
    >[StateKey][EventKey] extends (...args: any[]) => infer TargetState
      ? TargetState extends StateFromFactory<States, infer TargetStateKey>
        ? TargetStateKey extends keyof States
          ? States[TargetStateKey]
          : never
        : never
      : never;
  }[keyof StateTransitions<States, Transitions>[StateKey]];
}>;

export type FlatMachineEventToTargetKeyMap<
  M extends StateMachine<StatesFactory<any>, any>,
> = FlatMemberUnionToIntersection<
  StateTransitionTargetKeys<M["def"]["states"], M["def"]["transitions"]>
>;

export type StateTransitionTargetKeys<
  States extends StatesFactory<any>,
  Transitions,
> = {
  [StateKey in keyof StateTransitions<States, Transitions>]: {
    [EventKey in keyof StateTransitions<
      States,
      Transitions
    >[StateKey]]: ReturnType<
      StateTransitions<States, Transitions>[StateKey][EventKey]
    >["key"];
  };
};

export type FlatMachineEvents<M extends StateMachine<StatesFactory<any>, any>> =
  FlatMemberUnionToIntersection<
    StateTransitions<M["def"]["states"], M["def"]["transitions"]>
  >;

export type FlatStateTransitionTargetIntersection<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = FlatMemberUnionToIntersection<StateTransitionTargets<States, Transitions>>;

export type FlatStateEventTransitionTargets<
  Transitions extends StateTransitions<any, any>,
> = {
  [StateKey in keyof Transitions]: {
    [EventKey in keyof Transitions[StateKey]]: ReturnType<
      Transitions[StateKey][EventKey]
    >;
  }[keyof Transitions[StateKey]];
}[keyof Transitions] extends infer T
  ? T extends object
    ? T
    : never
  : never;
