import {
  EventExitStatesIntersection,
  FlatEventKeys,
  FlatExitStates,
  StateEventTransitionFuncs,
  StateFromFactory,
  StateMachineEvent,
  StatesFactory,
  TransitionConfig,
} from "../machine-types";
import { Middleware } from "../dev/lifecycle-v2";

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
  States extends StatesFactory<any>,
  StateKey extends keyof Transitions | "*",
> = {
  leave: Middleware<StateMachineEvent<
  Transitions,
  States,
  FlatEventKeys<Transitions, States>,
  StateFromFactory<
    States,
    StateKey extends keyof States ? StateKey : keyof States
  >,
  StateFromFactory<States>
>>;
  enter: Middleware<StateMachineEvent<
      Transitions,
      States,
      FlatEventKeys<Transitions, States>,
      StateFromFactory<States>,
      StateFromFactory<
        States,
        StateKey extends keyof States ? StateKey : keyof States
      >
    >>
};

export type StateTransitionHookConfig<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory<any>,
  StateKey extends keyof Transitions | "*",
> = HookConfig<StateTransitionHooks<Transitions, States, StateKey>>;


type On<
  TransitionsRawConfig extends TransitionConfig<States>,
  States extends StatesFactory<any>,
  StateKey extends keyof TransitionsRawConfig | "*",
> =
  // regular state
  StateKey extends keyof States
    ? // specific state
      {
        [Event in
          | keyof TransitionsRawConfig[StateKey]
          | "*"]?: Event extends FlatEventKeys<TransitionsRawConfig, States> // specific event
          ? ReturnType<
              StateEventTransitionFuncs<
                TransitionsRawConfig,
                States
              >[StateKey][Event]
            > extends StateFromFactory<States>
            ? TransitionHookConfig<
                StateMachineEvent<
                  TransitionsRawConfig,
                  States,
                  Event, // should constrain params
                  StateFromFactory<States, StateKey>,
                  ReturnType<
                    StateEventTransitionFuncs<
                      TransitionsRawConfig,
                      States
                    >[StateKey][Event]
                  >,
                  Parameters<
                    StateEventTransitionFuncs<
                      TransitionsRawConfig,
                      States
                    >[StateKey][Event]
                  >
                >
              >
            : never
          : // wildcard event
            TransitionHookConfig<
              StateMachineEvent<
                TransitionsRawConfig,
                States,
                FlatEventKeys<TransitionsRawConfig, States>,
                StateFromFactory<States, StateKey>,
                StateFromFactory<States>, // could be limited
                any[]
              >
            >;
        // specific event returns keyof states
        // fix this. we need to transform transitionconfig above to StatesToEventsToStates
      }
    : // wildcard state
      {
        [AnyStateEvent in
          | FlatEventKeys<TransitionsRawConfig, States>
          | "*"]?: TransitionHookConfig<
          StateMachineEvent<
            TransitionsRawConfig,
            States,
            AnyStateEvent extends "*"
              ? FlatEventKeys<TransitionsRawConfig, States>
              : AnyStateEvent,
            // Source State
            StateFromFactory<
              States,
              keyof {
                [K in keyof TransitionsRawConfig]: AnyStateEvent extends keyof TransitionsRawConfig[K]
                  ? Extract<K, string>
                  : Extract<keyof TransitionsRawConfig, string>;
              } &
                keyof States
            >,
            // Target State
            AnyStateEvent extends "*"
              ? // wildcard event
                FlatExitStates<
                  TransitionsRawConfig,
                  States
                > extends StateFromFactory<States>
                ? FlatExitStates<TransitionsRawConfig, States>
                : never
              : // not wildcard event
              // if valid exit state
              AnyStateEvent extends keyof EventExitStatesIntersection<
                  TransitionsRawConfig,
                  States
                >
              ? // and returns state from factory
                EventExitStatesIntersection<
                  TransitionsRawConfig,
                  States
                >[AnyStateEvent] extends StateFromFactory<States>
                ? // then return the union of all possible exit states for that event key
                  EventExitStatesIntersection<
                    TransitionsRawConfig,
                    States
                  >[AnyStateEvent]
                : never
              : never,
            any[] // could be union of all possible params lol I'm tired
          >
        >;
      };

export type StateEventHookConfig<
Transitions extends TransitionConfig<States>,
States extends StatesFactory<any>,
> = {
  [StateKey in keyof Transitions | "*"]?: {
    on?: On<Transitions, States, StateKey>    
  } & StateTransitionHookConfig<Transitions, States, StateKey>;
};
