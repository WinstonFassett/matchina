import {
  EventExitStatesIntersection,
  FlatEventKeys,
  FlatExitStates,
  StateEventTransitionFuncs,
  StateMachineEvent,
  TransitionConfig,
} from "../machine-types";
import { StateFromFactory, StatesFactory } from "../states";

export type TransitionHookExtensions<T> = {
  guard: (change: T) => boolean;
  before: (change: T) => any;
  handle: (change: T) => T | undefined;
  after: (change: T) => any;
};

export type PartialTransitionHookExtensions<T> = {
  guard?: (change: T) => boolean;
  before?: (change: T) => any;
  handle?: (change: T) => T | undefined;
  after?: (change: T) => any;
};

export type StateTransitionHooks<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
  StateKey extends keyof Transitions | "*",
> = {
  leave?: (
    change: StateMachineEvent<
      States,
      Transitions,
      FlatEventKeys<States, Transitions>,
      // source state
      // StateFromFactory<States>,
      StateFromFactory<
        States,
        StateKey extends keyof States ? StateKey : keyof States
      >,
      // target state
      StateFromFactory<States>
    >,
  ) => void;
  enter?: (
    change: StateMachineEvent<
      States,
      Transitions,
      FlatEventKeys<States, Transitions>,
      // from any state
      StateFromFactory<States>,
      // to this state
      // StateFromFactory<States>
      StateFromFactory<
        States,
        StateKey extends keyof States ? StateKey : keyof States
      >
    >,
  ) => void;
};

// type Test1<
//   States extends StatesFactory<any>,
//   TransitionsRawConfig extends TransitionConfig<States>,
//   TransitionKey extends keyof TransitionsRawConfig | "*",
//   StateKey extends TransitionKey extends keyof States
//     ? TransitionKey
//     : keyof States,
//   EventKey extends keyof TransitionsRawConfig[StateKey] | "*",
// > = TransitionKey extends keyof States
//   ? {
//       key: StateKey;
//       eventKey: EventKey;
//       transitionKey: TransitionKey;
//       event: StateMachineEvent<
//         States,
//         TransitionsRawConfig,
//         EventKey extends "*"
//           ? FlatEventKeys<States, TransitionsRawConfig>
//           : EventKey extends "*"
//           ? FlatEventKeys<States, TransitionsRawConfig>
//           : EventKey,
//         // FlatEventKeys<States, TransitionsRawConfig>
//         StateFromFactory<States, StateKey>,
//         StateFromFactory<States> // could be limited
//       >;
//     }
//   : never;

type On<
  States extends StatesFactory,
  TransitionsRawConfig extends TransitionConfig<States>,
  StateKey extends keyof TransitionsRawConfig | "*",
> =
  // regular state
  StateKey extends keyof States
    ? // specific state
      {
        [Event in
          | keyof TransitionsRawConfig[StateKey]
          | "*"]?: Event extends FlatEventKeys<States, TransitionsRawConfig> // specific event
          ? ReturnType<
              StateEventTransitionFuncs<
                States,
                TransitionsRawConfig
              >[StateKey][Event]
            > extends StateFromFactory<States>
            ? PartialTransitionHookExtensions<
                StateMachineEvent<
                  States,
                  TransitionsRawConfig,
                  Event, // should constrain params
                  StateFromFactory<States, StateKey>,
                  ReturnType<
                    StateEventTransitionFuncs<
                      States,
                      TransitionsRawConfig
                    >[StateKey][Event]
                  >,
                  Parameters<
                    StateEventTransitionFuncs<
                      States,
                      TransitionsRawConfig
                    >[StateKey][Event]
                  >
                >
              >
            : never
          : // wildcard event
            PartialTransitionHookExtensions<
              StateMachineEvent<
                States,
                TransitionsRawConfig,
                FlatEventKeys<States, TransitionsRawConfig>,
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
          | FlatEventKeys<States, TransitionsRawConfig>
          | "*"]?: PartialTransitionHookExtensions<
          StateMachineEvent<
            States,
            TransitionsRawConfig,
            AnyStateEvent extends "*"
              ? FlatEventKeys<States, TransitionsRawConfig>
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
                  States,
                  TransitionsRawConfig
                > extends StateFromFactory<States>
                ? FlatExitStates<States, TransitionsRawConfig>
                : never
              : // not wildcard event
              // if valid exit state
              AnyStateEvent extends keyof EventExitStatesIntersection<
                  States,
                  TransitionsRawConfig
                >
              ? // and returns state from factory
                EventExitStatesIntersection<
                  States,
                  TransitionsRawConfig
                >[AnyStateEvent] extends StateFromFactory<States>
                ? // then return the union of all possible exit states for that event key
                  EventExitStatesIntersection<
                    States,
                    TransitionsRawConfig
                  >[AnyStateEvent]
                : never
              : never,
            any[] // could be union of all possible params lol I'm tired
          >
        >;
      };

export type StateEventHookConfig<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
> = {
  [StateKey in keyof Transitions | "*"]?: {
    on?: On<States, Transitions, StateKey>;
  } & StateTransitionHooks<States, Transitions, StateKey>;
};
