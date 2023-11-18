import {
  AnyStatesFactory,
  FlatEventKeys,
  StateEventTransitionFuncs,
  StateFromFactory,
  StateTransitionEvent,
  StateChangeMachineEvent,
  TransitionConfig,
  FlatExitStates,
  EventExitStatesIntersection,
} from "./machine-v2";
import { Middleware } from "../extras/middleware";

type HookConfig<T> = {
  [K in keyof T]?: T[K] | T[K][];
};

export type TransitionHookExtensions<T> = {
  guard: Middleware<T>;
  before: Middleware<T>;
  handle: Middleware<T>;
  after: Middleware<T>;
};

export type TransitionHookConfig<T> = HookConfig<TransitionHookExtensions<T>>;

export type StateTransitionHooks<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
  StateKey extends keyof Transitions | "*",
  Event extends StateTransitionEvent<Transitions, States> = StateTransitionEvent<Transitions, States>,
> = {
  leave: Middleware<
    StateChangeMachineEvent<
      Event['type'],
      Event['to'],
      Event['from'],
      Event['params']
    >
  >;
  enter: Middleware<
  StateChangeMachineEvent<
      Event['type'],
      Event['to'],
      Event['from'],
      Event['params']
      // Transitions,
      // States,
      // FlatEventKeys<Event>,
      // StateFromFactory<States>,
      // StateFromFactory<
      //   States,
      //   StateKey extends keyof States ? StateKey : keyof States
      // >
    >
  >;
};

export type StateTransitionHookConfig<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
  StateKey extends keyof Transitions | "*",
> = HookConfig<StateTransitionHooks<Transitions, States, StateKey>>;

type On<
  TC extends TransitionConfig<SF>,
  SF extends AnyStatesFactory,
  SK extends keyof TC | "*",
  E extends StateTransitionEvent<TC, SF> = StateTransitionEvent<TC, SF>, // HMM DUNNO
  EK extends E['type'] = E['type'],
> =
  // regular state
  SK extends keyof SF
    ? // specific state
      {
        [TEK in
          | keyof TC[SK]
          | "*"]?: 
          TEK extends EK //FlatEventKeys<E> // specific event
          ? ReturnType<
              StateEventTransitionFuncs<
                TC,
                SF
              >[SK][TEK]
            > extends StateFromFactory<SF>
            ? TransitionHookConfig<
                StateChangeMachineEvent<
                  EK,
                  StateFromFactory<SF, SK>,
                  StateFromFactory<SF>,
                  any[]
                >
                // StateMachineEvent<
                //   TC,
                //   SF,
                //   Event, // should constrain params
                //   StateFromFactory<SF, SK>,
                //   ReturnType<
                //     StateEventTransitionFuncs<
                //       TC,
                //       SF
                //     >[SK][Event]
                //   >,
                //   Parameters<
                //     StateEventTransitionFuncs<
                //       TC,
                //       SF
                //     >[SK][Event]
                //   >
                // >
              >
            : never
          : // wildcard event
            TransitionHookConfig<
              StateChangeMachineEvent<
                EK,
                StateFromFactory<SF, SK>,
                StateFromFactory<SF>,
                any[]
              >
              // StateMachineEvent<
              //   TC,
              //   SF,
              //   EK,
              //   StateFromFactory<SF, SK>,
              //   StateFromFactory<SF>, // could be limited
              //   any[]
              // >
            >;
        // specific event returns keyof states
        // fix this. we need to transform transitionconfig above to StatesToEventsToStates
      }
    : // wildcard state
      {
        [AnyStateEvent in
          | EK
          | "*"]?: TransitionHookConfig<

          StateChangeMachineEvent<
            EK,
            StateFromFactory<SF>,
            StateFromFactory<SF>,
            any[]
          >

          // StateMachineEvent<
          //   TC,
          //   SF,
          //   AnyStateEvent extends "*"
          //     ? EK
          //     : AnyStateEvent,
          //   // Source State
          //   StateFromFactory<
          //     SF,
          //     keyof {
          //       [K in keyof TC]: AnyStateEvent extends keyof TC[K]
          //         ? Extract<K, string>
          //         : Extract<keyof TC, string>;
          //     } &
          //       keyof SF
          //   >,
          //   // Target State
          //   AnyStateEvent extends "*"
          //     ? // wildcard event
          //       FlatExitStates<
          //         TC,
          //         SF
          //       > extends StateFromFactory<SF>
          //       ? FlatExitStates<TC, SF>
          //       : never
          //     : // not wildcard event
          //     // if valid exit state
          //     AnyStateEvent extends keyof EventExitStatesIntersection<
          //         TC,
          //         SF
          //       >
          //     ? // and returns state from factory
          //       EventExitStatesIntersection<
          //         TC,
          //         SF
          //       >[AnyStateEvent] extends StateFromFactory<SF>
          //       ? // then return the union of all possible exit states for that event key
          //         EventExitStatesIntersection<
          //           TC,
          //           SF
          //         >[AnyStateEvent]
          //       : never
          //     : never,
          //   any[] // could be union of all possible params lol I'm tired
          // >
        >;
      };

export type StateEventHookConfig<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
> = {
  [StateKey in keyof Transitions | "*"]?: {
    on?: On<Transitions, States, StateKey>;
  } & StateTransitionHookConfig<Transitions, States, StateKey>;
};
