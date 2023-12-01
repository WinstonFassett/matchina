import { Middleware } from "../../extras/middleware";
import { FlatMemberUnion, Members, TUnionToIntersection } from "../../types";
import { Abortware } from "./Abortware";
import { StateEventTransitionFuncs } from "./factory-event-api";
import { AnyStatesFactory, FactoryMachineEvent, StateFromFactory, TransitionConfig } from './factory-machine';
import { Funcware } from "./method";
import { } from './types';

type HookConfig<T> = {
  [K in keyof T]?: T[K] | T[K][];
};

// export type Guard<F extends (...args: any) => any> = (...params: Parameters<F>) => boolean;
type Guard<E> = (ev: E) => boolean;
type Effect<E> = (ev: E) => void;
type Handle<E> = (ev: E) => E | void;

export type TransitionHookExtensions<E> = {
  // before: Middleware<T>;
  // send: Funcware<StateMachinery<E>['send']>
  begin: Abortware<E>;
  resolve: Funcware<(ev: Partial<E>) => E>;
  transition: Abortware<E>;
  guard: Guard<E>;  
  handle: Handle<E>;
  before: Abortware<E>;
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
    // StateMachineEvent<
    //   Transitions,
    //   States,
    //   FlatEventKeys<Transitions, States>,
    //   StateFromFactory<
    //     States,
    //     StateKey extends keyof States ? StateKey : keyof States
    //   >,
    //   StateFromFactory<States>
    // >
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
          Event extends FlatEventKeys<Transitions, States> // specific event // specific event
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
                // StateMachineEvent<
                //   TransitionsRawConfig,
                //   States,
                //   Event, // should constrain params
                //   StateFromFactory<States, StateKey>,
                //   ReturnType<
                //     StateEventTransitionFuncs<
                //       TransitionsRawConfig,
                //       States
                //     >[StateKey][Event]
                //   >,
                //   Parameters<
                //     StateEventTransitionFuncs<
                //       TransitionsRawConfig,
                //       States
                //     >[StateKey][Event]
                //   >
                // >
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
        // specific event returns keyof states
        // fix this. we need to transform transitionconfig above to StatesToEventsToStates
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
          // StateMachineEvent<
          //   Transitions,
          //   States,
          //   AnyStateEvent extends "*"
          //     ? FlatEventKeys<Transitions, States>
          //     : AnyStateEvent,
          //   // Source State
          //   StateFromFactory<
          //     States,
          //     keyof {
          //       [K in keyof Transitions]: AnyStateEvent extends keyof Transitions[K]
          //         ? Extract<K, string>
          //         : Extract<keyof Transitions, string>;
          //     } &
          //       keyof States
          //   >,
          //   // Target State
          //   AnyStateEvent extends "*"
          //     ? // wildcard event
          //       FlatExitStates<
          //         Transitions,
          //         States
          //       > extends StateFromFactory<States>
          //       ? FlatExitStates<Transitions, States>
          //       : never
          //     : // not wildcard event
          //       // if valid exit state
          //       AnyStateEvent extends keyof EventExitStatesIntersection<
          //           Transitions,
          //           States
          //         >
          //       ? // and returns state from factory
          //         EventExitStatesIntersection<
          //           Transitions,
          //           States
          //         >[AnyStateEvent] extends StateFromFactory<States>
          //         ? // then return the union of all possible exit states for that event key
          //           EventExitStatesIntersection<
          //             Transitions,
          //             States
          //           >[AnyStateEvent]
          //         : never
          //       : never,
          //   any[] // could be union of all possible params lol I'm tired
          // >
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
// provides the return types of all state-event transitions
