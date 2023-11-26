import { Middleware } from "../../extras/middleware";
import { AnyStatesFactory, FactoryMachineEvent, FactoryTransitionConfig, StateFromFactory } from "./factory-machine";

import { FlatMemberUnion, TUnionToIntersection } from "../../types";
import { StateEventTransitionFuncs } from './factory-event-api';

export type StateEventHookConfig<
  TC extends FactoryTransitionConfig<SF>,
  SF extends AnyStatesFactory,
> = {
  [SK in (keyof TC & keyof SF) | "*"]?: {
    on?: On<TC, SF, SK>;
  } & StateTransitionHookConfig<TC, SF, SK>;
};

export type StateTransitionHookConfig<
  Transitions extends FactoryTransitionConfig<States>,
  States extends AnyStatesFactory,
  StateKey extends keyof States | "*",
> = HookConfig<StateTransitionHooks<Transitions, States, StateKey>>;

export type StateTransitionHooks<
  Transitions extends FactoryTransitionConfig<States>,
  States extends AnyStatesFactory,
  StateKey extends keyof States | "*",
  Event extends FactoryMachineEvent<
    Transitions,
    States
  > = FactoryMachineEvent<Transitions, States>,
> = {
  leave: Middleware<Event & {    
    from: StateFromFactory<States, StateKey>,    
  }>;
  enter: Middleware<Event & {    
    to: StateFromFactory<States, StateKey>,    
  }>;
};

export type TransitionHookExtensions<T> = {
  guard: Middleware<T>;
  before: Middleware<T>;
  handle: Middleware<T>;
  after: Middleware<T>;
};

type HookConfig<T> = {
  [K in keyof T]?: T[K] | T[K][];
};

export type TransitionHookConfig<T> = HookConfig<TransitionHookExtensions<T>>;

type On<
  TC extends FactoryTransitionConfig<SF>,
  SF extends AnyStatesFactory,
  SK extends keyof TC | "*",
  E extends FactoryMachineEvent<TC, SF> = FactoryMachineEvent<TC, SF>,
  EK extends E["type"] = E["type"],
> =
  // regular state
  SK extends keyof SF
    ? {
        [StateEventKey in keyof TC[SK] | "*"]?: StateEventKey extends EK //FlatEventKeys<E> // specific event
          ? ReturnType<
              StateEventTransitionFuncs<TC, SF>[SK][StateEventKey]
            > extends StateFromFactory<SF>
            ? TransitionHookConfig<
                StateChangeMachineEvent<
                  StateEventKey,
                  // StateFromFactory<SF>,
                  ReturnType<
                    StateEventTransitionFuncs<TC, SF>[SK][StateEventKey]
                  >,
                  StateFromFactory<SF, SK>,
                  Parameters<
                    StateEventTransitionFuncs<TC, SF>[SK][StateEventKey]
                  >
                >
              >
            : never
          : TransitionHookConfig<
              StateChangeMachineEvent<
                EK,
                StateFromFactory<SF>,
                StateFromFactory<SF, SK>,
                any[]
              >
            >;
      }
    : {
        [AnyStateEvent in EK | "*"]?: TransitionHookConfig<
          StateChangeMachineEvent<
            AnyStateEvent extends "*" ? EK : AnyStateEvent,
            AnyStateEvent extends keyof EventExitStatesIntersection<TC, SF>
              ? EventExitStatesIntersection<
                  TC,
                  SF
                >[AnyStateEvent] extends StateFromFactory<SF>
                ? EventExitStatesIntersection<TC, SF>[AnyStateEvent]
                : StateFromFactory<SF>
              : StateFromFactory<SF>,
            StateFromFactory<
              SF,
              AnyStateEvent extends keyof TC[SK]
                ? Extract<SK, string>
                : Extract<keyof TC, string>
            >,
            any[]
          >
        >;
      };

export type EventExitStatesIntersection<
  Transitions extends FactoryTransitionConfig<States>,
  States extends AnyStatesFactory,
> = TUnionToIntersection<
  FlatMemberUnion<StatesToEventsToStates<Transitions, States>>
>;

export type StatesToEventsToStates<
  Transitions extends FactoryTransitionConfig<States>,
  States extends AnyStatesFactory,
> = {
  [StateKey in keyof StateEventTransitionFuncs<Transitions, States>]: {
    [EventKey in keyof StateEventTransitionFuncs<
      Transitions,
      States
    >[StateKey]]: ReturnType<
      StateEventTransitionFuncs<Transitions, States>[StateKey][EventKey]
    >;
  };
};