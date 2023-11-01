// @ts-nocheck
/* eslint-disable unicorn/no-abusive-eslint-disable */
/* eslint-disable */

import { StatesFactory } from "../states";
import { FlatMemberUnionToIntersection } from "../types";
import {
  TransitionConfig,
  StateEventTransitionSenders,
  StateMachine,
  FlatExitStateKeys,
  StateEventTransitionFuncs,
  StatesToEventsToStates,
} from "../machine-types";

type PartialPick<T, K extends keyof T> = Partial<T> & Pick<T, K>;

export type FlattenMemberKeys<T> = {
  [K in keyof T]: keyof T[K];
}[keyof T];

export type Filter<T, K> = {
  [TK in keyof T]: TK extends K ? T[TK] : never;
}[keyof T];

export type FlatEventers<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
> = FlatMemberUnionToIntersection<
  StateEventTransitionSenders<States, Transitions>
>;

export type FlatMachineEventers<M extends StateMachine<StatesFactory, any>> =
  FlatEventers<M["def"]["states"], M["def"]["transitions"]>;

// not sure about this one
export type FlatMachineReturnEventToTargetKeyMap<
  M extends StateMachine<StatesFactory, any>,
> = FlatMemberUnionToIntersection<
  FlatExitStateKeys<M["def"]["states"], M["def"]["transitions"]>
>;

export type FlatEventTargetsMap<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
> = {
  [StateKey in keyof StateEventTransitionFuncs<States, Transitions>]: {
    [EventKey in keyof StateEventTransitionFuncs<
      States,
      Transitions
    >[StateKey]]: ReturnType<
      StateEventTransitionFuncs<States, Transitions>[StateKey][EventKey]
    >;
  };
};

export type FlatEventTargets<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
> = {
  [StateKey in keyof StateEventTransitionFuncs<States, Transitions>]: {
    [EventKey in keyof StateEventTransitionFuncs<
      States,
      Transitions
    >[StateKey]]: ReturnType<
      StateEventTransitionFuncs<States, Transitions>[StateKey][EventKey]
    >;
  };
};

export type FlatMachineEventTargets<
  M extends StateMachine<StatesFactory, any>,
> = FlatMemberUnionToIntersection<
  StatesToEventsToStates<M["def"]["states"], M["def"]["transitions"]>
>;

export type FlattenedTargets<T> = {
  [K1 in keyof T]: {
    [K2 in keyof T[K1]]: T[K1][K2];
  };
}[keyof T];

export type FlattenReturnStateTargetTypes<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
> = ValueTypes<{
  [StateKey in keyof StateEventTransitionFuncs<States, Transitions>]: {
    [EventKey in keyof StateEventTransitionFuncs<
      States,
      Transitions
    >[StateKey]]: StateEventTransitionFuncs<
      States,
      Transitions
    >[StateKey][EventKey] extends (...args: any[]) => infer TargetState
      ? TargetState extends StateFromFactory<States, infer TargetStateKey>
        ? TargetStateKey extends keyof States
          ? States[TargetStateKey]
          : never
        : never
      : never;
  }[keyof StateEventTransitionFuncs<States, Transitions>[StateKey]];
}>;

export type FlatMachineEventToTargetKeyMap<
  M extends StateMachine<StatesFactory, any>,
> = FlatMemberUnionToIntersection<
  StateTransitionTargetKeys<M["def"]["states"], M["def"]["transitions"]>
>;

export type StateTransitionTargetKeys<
  States extends StatesFactory,
  Transitions,
> = {
  [StateKey in keyof StateEventTransitionFuncs<States, Transitions>]: {
    [EventKey in keyof StateEventTransitionFuncs<
      States,
      Transitions
    >[StateKey]]: ReturnType<
      StateEventTransitionFuncs<States, Transitions>[StateKey][EventKey]
    >["key"];
  };
};

export type FlatMachineEvents<M extends StateMachine<StatesFactory, any>> =
  FlatMemberUnionToIntersection<
    StateEventTransitionFuncs<M["def"]["states"], M["def"]["transitions"]>
  >;

export type FlatStateTransitionTargetIntersection<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
> = FlatMemberUnionToIntersection<StatesToEventsToStates<States, Transitions>>;

export type FlatStateEventTransitionTargets<
  Transitions extends StateEventTransitionFuncs<any, any>,
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
