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
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
  StateKey extends keyof Transitions | "*",
> = {
  leave?: (
    change: StateMachineEvent<
      Transitions,
      States,
      FlatEventKeys<Transitions, States>,
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
      Transitions,
      States,
      FlatEventKeys<Transitions, States>,
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
//           ? FlatEventKeys<TransitionsRawConfig, States>
//           : EventKey extends "*"
//           ? FlatEventKeys<TransitionsRawConfig, States>
//           : EventKey,
//         // FlatEventKeys<TransitionsRawConfig, States>
//         StateFromFactory<States, StateKey>,
//         StateFromFactory<States> // could be limited
//       >;
//     }
//   : never;

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
            ? PartialTransitionHookExtensions<
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
            PartialTransitionHookExtensions<
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
          | "*"]?: PartialTransitionHookExtensions<
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
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = {
  [StateKey in keyof Transitions | "*"]?: {
    on?: On<Transitions, States, StateKey>;
  } & StateTransitionHooks<States, Transitions, StateKey>;
};
