import { AbortableEventHandler, Funcware } from "./ext";
import {
  AnyFactoryState,
  FactoryMachineContext,
  FactoryMachineEvent, StateEventTransitionFuncs
} from "./factory-machine";
import { StateMachineEvent, StateMachinery } from "./state-machine";
import { Filters } from "./typeguards";
import { Effect, Middleware } from "./types";
import {
  FlatMemberUnion,
  Members,
  TUnionToIntersection,
} from "./utility-types";

type HookConfig<T> = {
  [K in keyof T]?: T[K] | T[K][];
};

export type TransitionHookExtensions<E extends StateMachineEvent> = {
  begin: AbortableEventHandler<E>;
  resolve: Funcware<(ev: Partial<E>) => E>;
  transition: AbortableEventHandler<E>;
  guard: StateMachinery<E>['guard'];
  handle: StateMachinery<E>['handle'];
  before: AbortableEventHandler<E>;
  effect: Effect<E>;
  leave: Effect<E>;
  enter: Effect<E>;
  notify: Effect<E>;
  after: Effect<E>;
  end: Effect<E>;
};

export type TransitionHookConfig<E extends StateMachineEvent<any, any>> = Filters<TransitionHookExtensions<E>>;

export type StateTransitionHooks<
  FC extends FactoryMachineContext,  
  StateKey extends keyof FC['transitions'] | "*",
> = {
  leave: Middleware<
    FactoryMachineEvent<FC> & {
      from: AnyFactoryState<
        FC['states'],
        StateKey extends keyof FC['states'] ? StateKey : keyof FC['states']
      >;
    }
  >;
  enter: Middleware<
    FactoryMachineEvent<FC> & {
      to: AnyFactoryState<
        FC['states'],
        StateKey extends keyof FC['states'] ? StateKey : keyof FC['states']
      >;
    }
  >;
};

export type StateTransitionHookConfig<
  FC extends FactoryMachineContext,
  StateKey extends keyof FC['transitions'] | "*",
> = Filters<StateTransitionHooks<FC, StateKey>>;

type On<
  FC extends FactoryMachineContext,
  StateKey extends keyof FC['transitions'] | "*",
  Transitions extends FC['transitions'] = FC['transitions'],
  States extends FC['states'] = FC['states'],
> =
  // regular state
  StateKey extends keyof States
    ? // specific state
      {
        [Event in
          | keyof Transitions[StateKey]
          | "*"]?: Event extends FlatFactoryEventKeys<FC> // specific event
          ? ReturnType<
              StateEventTransitionFuncs<FC>[StateKey][Event]
            > extends AnyFactoryState<States>
            ? TransitionHookConfig<
                FactoryMachineEvent<FC> & {
                  type: Event;
                  from: AnyFactoryState<
                    States,
                    StateKey extends keyof States ? StateKey : keyof States
                  >;
                  to: ReturnType<
                    StateEventTransitionFuncs<
                      FC
                    >[StateKey][Event]
                  >;
                  params: Parameters<
                    StateEventTransitionFuncs<
                      FC
                    >[StateKey][Event]
                  >;
                }
              >
            : never
          : // wildcard event
            TransitionHookConfig<
              FactoryMachineEvent<FC> & {
                from: AnyFactoryState<
                  States,
                  StateKey extends keyof States ? StateKey : keyof States
                >;
              }
            >;
      }
    : // wildcard state
      {
        [AnyStateEvent in
          | FlatFactoryEventKeys<FC>
          | "*"]?: TransitionHookConfig<
          FactoryMachineEvent<FC> & {
            type: AnyStateEvent extends "*"
              ? FlatFactoryEventKeys<FC>
              : AnyStateEvent;
            from: AnyFactoryState<
              States,
              StateKey extends keyof States ? StateKey : keyof States
            >;
            to: ReturnType<
              StateEventTransitionFuncs<
                FC
              >[StateKey][AnyStateEvent]
            >;
            params: Parameters<
              StateEventTransitionFuncs<
                FC
              >[StateKey][AnyStateEvent]
            >;
          }
        >;
      };

export type FlatExitStates<
  FC extends FactoryMachineContext,
  States extends FC['states'] = FC['states']
> = Members<{
  [StateKey in keyof StateEventTransitionFuncs<FC>]: {
    [EventKey in keyof StateEventTransitionFuncs<
      FC
    >[StateKey]]: StateEventTransitionFuncs<
      FC
    >[StateKey][EventKey] extends (...args: any[]) => infer TargetState
      ? TargetState extends AnyFactoryState<States, infer TargetStateKey>
        ? TargetStateKey extends keyof States
          ? TargetState
          : never
        : never
      : never;
  }[keyof StateEventTransitionFuncs<FC>[StateKey]];
}>;

export type EventExitStatesIntersection<
FC extends FactoryMachineContext,
> = TUnionToIntersection<
  FlatMemberUnion<StatesToEventsToStates<FC>>
>;

export type StatesToEventsToStates<
  FC extends FactoryMachineContext,
> = {
  [StateKey in keyof StateEventTransitionFuncs<FC>]: {
    [EventKey in keyof StateEventTransitionFuncs<FC>[StateKey]]: ReturnType<
      StateEventTransitionFuncs<FC>[StateKey][EventKey]
    >;
  };
};

export type StateEventHookConfig<
FC extends FactoryMachineContext,
> = {
  [StateKey in string & (keyof FC['transitions'] | "*")]?: {
    on?: On<FC, StateKey>;
  } & StateTransitionHookConfig<FC, StateKey>;
};

export type FlatFactoryEventKeys<
  FC extends FactoryMachineContext,
> = string &
  {
    [StateKey in keyof StateEventTransitionFuncs<
      FC
    >]: keyof StateEventTransitionFuncs<FC>[StateKey];
  }[keyof StateEventTransitionFuncs<FC>];

