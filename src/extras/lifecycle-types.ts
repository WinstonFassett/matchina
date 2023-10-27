import { StateFromFactory, StatesFactory } from "../states";
import {
  EventExitStatesIntersection,
  FlatEventKeys,
  FlatExitStates,
  StateMachineEvent,
  TransitionConfig,
} from "../machine-types";

export type TransitionHookExtensions<T> = {
  guard?: (change: T) => boolean;
  before?: (change: T) => any;
  handle?: (change: T) => T | undefined;
  after?: (change: T) => any;
};

export type StateTransitionHooks<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
  StateKey extends keyof Transitions | "*",
> = {
  leave?: (
    change: StateMachineEvent<
      States,
      Transitions,
      FlatEventKeys<States, Transitions>,
      // source state
      StateFromFactory<States, StateKey extends "*" ? keyof States : StateKey>,
      // target state
      StateFromFactory<States>
    >,
  ) => any;
  enter?: (
    change: StateMachineEvent<
      States,
      Transitions,
      FlatEventKeys<States, Transitions>,
      // from any state
      StateFromFactory<States>,
      // to this state
      StateFromFactory<States, StateKey extends "*" ? keyof States : StateKey>
    >,
  ) => any;
};

type On<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
  StateKey extends keyof Transitions | "*",
> =
  // wildcard state
  StateKey extends "*"
    ? {
        [AnyStateEvent in
          | FlatEventKeys<States, Transitions>
          | "*"]?: TransitionHookExtensions<
          StateMachineEvent<
            States,
            Transitions,
            AnyStateEvent extends "*"
              ? FlatEventKeys<States, Transitions>
              : AnyStateEvent,
            // Source State
            StateFromFactory<
              States,
              keyof {
                [K in keyof Transitions]: AnyStateEvent extends keyof Transitions[K]
                  ? K
                  : keyof Transitions;
              }
            >,
            // Target State
            AnyStateEvent extends "*"
              ? FlatExitStates<
                  States,
                  Transitions
                > extends StateFromFactory<States>
                ? FlatExitStates<States, Transitions>
                : never
              : AnyStateEvent extends keyof EventExitStatesIntersection<
                  States,
                  Transitions
                >
              ? EventExitStatesIntersection<
                  States,
                  Transitions
                >[AnyStateEvent] extends StateFromFactory<States>
                ? EventExitStatesIntersection<
                    States,
                    Transitions
                  >[AnyStateEvent]
                : never
              : never,
            any[] // could be union of all possible params lol I'm tired
          >
        >;
      }
    : {
        [Event in keyof Transitions[StateKey] | "*"]?: Event extends "*"
          ? TransitionHookExtensions<
              StateMachineEvent<
                States,
                Transitions,
                keyof Transitions[StateKey],
                StateFromFactory<States, StateKey>,
                StateFromFactory<States>, // could be limited
                any[]
              >
            >
          : Transitions[StateKey][Event] extends keyof States
          ? TransitionHookExtensions<
              StateMachineEvent<
                States,
                Transitions,
                Event, // should constrain params
                StateFromFactory<States, StateKey>,
                StateFromFactory<States, Transitions[StateKey][Event]>,
                Parameters<States[Transitions[StateKey][Event]]>
              >
            >
          : never;
      };

export type StateEventHookConfig<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = {
  [StateKey in keyof Transitions | "*"]?: {
    on?: On<States, Transitions, StateKey>;
  } & StateTransitionHooks<States, Transitions, StateKey>;
};
