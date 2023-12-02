import { Middleware } from "./dev/v1/middleware";
import { FlatMemberUnion, Members, TUnionToIntersection } from "./utility-types";
import { Funcware } from "./ext/funcware/funcware";
import { AbortableEventware } from "./ext/funcware/abortable";
import { StateEventTransitionFuncs } from "./factory-event-api";
import { AnyStatesFactory, FactoryMachineEvent, StateFromFactory, TransitionConfig } from './factory-machine';
import { Guard, Handle, Effect } from "./types";
import { } from './types';

type HookConfig<T> = {
  [K in keyof T]?: T[K] | T[K][];
};

export type TransitionHookExtensions<E> = {
  begin: AbortableEventware<E>;
  resolve: Funcware<(ev: Partial<E>) => E>;
  transition: AbortableEventware<E>;
  guard: Guard<E>;  
  handle: Handle<E>;
  before: AbortableEventware<E>;
  effect: Effect<E>;
  leave: Effect<E>;
  enter: Effect<E>;
  notify: Effect<E>;
  after: Effect<E>;
  end: Effect<E>
};

export type TransitionHookConfig<T> = HookConfig<TransitionHookExtensions<T>>;

export type StateTransitionHooks<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
  StateKey extends keyof Transitions | "*",
> = {
  leave: Middleware<
    FactoryMachineEvent<Transitions, States> & {
      from: StateFromFactory<
        States,
        StateKey extends keyof States ? StateKey : keyof States
      >;
    }
  >;
  enter: Middleware<
    FactoryMachineEvent<Transitions, States> & {
      to: StateFromFactory<
        States,
        StateKey extends keyof States ? StateKey : keyof States
      >;
    }
  >;
};

export type StateTransitionHookConfig<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
  StateKey extends keyof Transitions | "*",
> = HookConfig<StateTransitionHooks<Transitions, States, StateKey>>;

type On<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
  StateKey extends keyof Transitions | "*",
> =
  // regular state
  StateKey extends keyof States
    ? // specific state
      {
        [Event in
          | keyof Transitions[StateKey]
          | "*"]?: 
          //specific event
          Event extends FlatEventKeys<Transitions, States>
          ? ReturnType<
              StateEventTransitionFuncs<
                Transitions,
                States
              >[StateKey][Event]
            > extends StateFromFactory<States>
            ? TransitionHookConfig<
                FactoryMachineEvent<Transitions, States> & {
                  type: Event;
                  from: StateFromFactory<
                    States,
                    StateKey extends keyof States ? StateKey : keyof States
                  >;
                  to: ReturnType<
                    StateEventTransitionFuncs<
                      Transitions,
                      States
                    >[StateKey][Event]>;
                  params: Parameters< StateEventTransitionFuncs<
                    Transitions,
                    States
                  >[StateKey][Event]>
                }
              >
            : never
          : // wildcard event
            TransitionHookConfig<
              FactoryMachineEvent<Transitions, States> & {
                from: StateFromFactory<
                  States,
                  StateKey extends keyof States ? StateKey : keyof States
                >;
              }
            >;
      }
    : // wildcard state
      {
        [AnyStateEvent in
          | FlatEventKeys<Transitions, States>
          | "*"]?: TransitionHookConfig<
            FactoryMachineEvent<Transitions, States> & {
              type: AnyStateEvent extends "*" ? FlatEventKeys<Transitions, States> : AnyStateEvent;
              from: StateFromFactory<
                States,
                StateKey extends keyof States ? StateKey : keyof States
              >;
              to: ReturnType<
                StateEventTransitionFuncs<
                  Transitions,
                  States
                >[StateKey][AnyStateEvent]
              >;
              params: Parameters<
                StateEventTransitionFuncs<
                  Transitions,
                  States
                >[StateKey][AnyStateEvent]
              >;
            }         
        >;
      };


export type FlatExitStates<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
> = Members<{
  [StateKey in keyof StateEventTransitionFuncs<Transitions, States>]: {
    [EventKey in keyof StateEventTransitionFuncs<
      Transitions,
      States
    >[StateKey]]: StateEventTransitionFuncs<
      Transitions,
      States
    >[StateKey][EventKey] extends (...args: any[]) => infer TargetState
      ? TargetState extends StateFromFactory<States, infer TargetStateKey>
        ? TargetStateKey extends keyof States
          ? TargetState
          : never
        : never
      : never;
  }[keyof StateEventTransitionFuncs<Transitions, States>[StateKey]];
}>;


export type EventExitStatesIntersection<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
> = TUnionToIntersection<
  FlatMemberUnion<StatesToEventsToStates<Transitions, States>>
>;
    
export type StatesToEventsToStates<
  Transitions extends TransitionConfig<States>,
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

export type StateEventHookConfig<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
> = {
  [StateKey in keyof Transitions | "*"]?: {
    on?: On<Transitions, States, StateKey>;
  } & StateTransitionHookConfig<Transitions, States, StateKey>;
};


export type FlatEventKeys<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
> = string &
  {
    [StateKey in keyof StateEventTransitionFuncs<
      Transitions,
      States
    >]: keyof StateEventTransitionFuncs<Transitions, States>[StateKey];
  }[keyof StateEventTransitionFuncs<Transitions, States>];
