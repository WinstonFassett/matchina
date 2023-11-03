// @ts-nocheck
/* eslint-disable unicorn/no-abusive-eslint-disable */
/* eslint-disable */

import { StatesMatchboxFactory } from "../states";
import { FlatMemberUnionToIntersection } from "../types";
import {
  TransitionConfig,
  StateEventTransitionSenders,
  StateMachine,
  FlatExitStateKeys,
  StateEventTransitionFuncs,
  StatesToEventsToStates,
} from "../machine-types";

// eslint-disable-next-line @typescript-eslint/ban-types
export type Simplify<T> = DrainOuterGeneric<{ [K in keyof T]: T[K] } & {}>;
export type DrainOuterGeneric<T> = [T] extends [unknown] ? T : never;

export type ExtractColumnType<DB, TB extends keyof DB, C> =
  // Inline version of DrainOuterGeneric for performance reasons.
  // Don't replace with DrainOuterGeneric!
  [DB] extends [unknown]
    ? {
        [T in TB]: C extends keyof DB[T] ? DB[T][C] : never;
      }[TB]
    : never;
export type DictionaryValues<Type> = Type[keyof Type];
export type UnknownRecord = Record<PropertyKey, unknown>;

export type AnyFunction = (...args: any[]) => unknown;
export type Func<A extends any[], R> = (...args: A) => R;
export type ArgsType<F extends Func<any, any>> = Parameters<F>;

export type KeysOfUnion<ObjectType> = ObjectType extends unknown
  ? keyof ObjectType
  : never;

export type Defined<Value> = Exclude<Value, null | undefined>;

export type PartialPick<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// eslint-disable-next-line @typescript-eslint/ban-types
export type NonNever<Type extends {}> = Pick<
  Type,
  { [Key in keyof Type]: Type[Key] extends never ? never : Key }[keyof Type]
>;

export type FlattenMemberKeys<T> = {
  [K in keyof T]: keyof T[K];
}[keyof T];

export type Filter<T, K> = {
  [TK in keyof T]: TK extends K ? T[TK] : never;
}[keyof T];

export type FlatEventers<
  States extends StatesMatchboxFactory,
  Transitions extends TransitionConfig<States>,
> = FlatMemberUnionToIntersection<
  StateEventTransitionSenders<States, Transitions>
>;

export type FlatMachineEventers<
  M extends StateMachine<StatesMatchboxFactory, any>,
> = FlatEventers<M["def"]["states"], M["def"]["transitions"]>;

// not sure about this one
export type FlatMachineReturnEventToTargetKeyMap<
  M extends StateMachine<StatesMatchboxFactory, any>,
> = FlatMemberUnionToIntersection<
  FlatExitStateKeys<M["def"]["states"], M["def"]["transitions"]>
>;

export type FlatEventTargetsMap<
  States extends StatesMatchboxFactory,
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
  States extends StatesMatchboxFactory,
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
  M extends StateMachine<StatesMatchboxFactory, any>,
> = FlatMemberUnionToIntersection<
  StatesToEventsToStates<M["def"]["states"], M["def"]["transitions"]>
>;

export type FlattenedTargets<T> = {
  [K1 in keyof T]: {
    [K2 in keyof T[K1]]: T[K1][K2];
  };
}[keyof T];

export type FlattenReturnStateTargetTypes<
  States extends StatesMatchboxFactory,
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
  M extends StateMachine<StatesMatchboxFactory, any>,
> = FlatMemberUnionToIntersection<
  StateTransitionTargetKeys<M["def"]["states"], M["def"]["transitions"]>
>;

export type StateTransitionTargetKeys<
  States extends StatesMatchboxFactory,
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

export type FlatMachineEvents<
  M extends StateMachine<StatesMatchboxFactory, any>,
> = FlatMemberUnionToIntersection<
  StateEventTransitionFuncs<M["def"]["states"], M["def"]["transitions"]>
>;

export type FlatStateTransitionTargetIntersection<
  States extends StatesMatchboxFactory,
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
