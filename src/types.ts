import { StateFromFactory, StatesFactory } from "./states";

// #region General
export type AnyStateKey = string | number | symbol;
export type AnyEventKey = string | number | symbol;
export interface ChangeEvent<Type, From, To> {
  type: Type;
  from: From;
  to: To;
}
export type SwapFunc<T> = (updater: (event: T) => T) => void;

// #endregion

// #region Transition Config
type SimpleStateTarget<T> = T;
type FunctionStateTarget<State> = (...args: any[]) => State;
type AdvancedFunctionStateTarget<
  States extends StatesFactory<any>,
  EventKey extends AnyEventKey = AnyEventKey,
> = (
  ...args: any[]
) => (
  state: StateFromFactory<States>,
  event: EventKey,
  machine: StateMachine<States, any>,
) => StateFromFactory<States>;
type ConfigStateTransitionExit<States extends StatesFactory<any>> =
  | SimpleStateTarget<keyof States>
  | AdvancedFunctionStateTarget<States>
  | FunctionStateTarget<StateFromFactory<States>>;

export type TransitionConfig<States extends StatesFactory<any>> = {
  [StateKey in keyof States]: {
    [EventKey: AnyEventKey]: ConfigStateTransitionExit<States>;
  };
};
// #endregion

// #region StateMachine

export interface StateMachine<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> {
  def: MachineDefinition<States, Transitions>;
  config: {
    initialState: StateFromFactory<States>;
  }; // consolidate with def?
  getState: () => StateFromFactory<States>;
  send: SendFunction<States, Transitions>;
  event: FlatMemberUnionToIntersection<StateTransitioners<States, Transitions>>;
  getChange: () => StateMachineEvent<States, Transitions>;
  reset(): void; // remove// externalize
  update: SwapFunc<StateMachineEvent<States, Transitions>>;
}

export type SendFunction<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = <
  E extends S extends keyof Transitions
    ? keyof StateTransitioners<States, Transitions>[S]
    : Event["type"],
  S extends keyof Transitions = keyof States,
  P = Exclude<
    S extends keyof Transitions
      ? Parameters<StateTransitioners<States, Transitions>[S][E]>[0]
      : Parameters<StateTransitioners<States, Transitions>[keyof States][E]>[0],
    undefined
  >,
>(
  event: E,
  ...params: P[]
) => void;

export type MachineCreator<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = (
  initialState: StateFromFactory<States>,
) => StateMachine<States, Transitions>;

export type MachineDefinition<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = {
  create: MachineCreator<States, Transitions>;
  states: States;
  transitions: Transitions;
};
// #endregion

// #region State Machine Event
export type StateMachineEvent<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
  EventKey extends FlattenedEventTypes<
    States,
    Transitions
  > = FlattenedEventTypes<States, Transitions>,
  From extends StateFromFactory<States> = StateFromFactory<States>,
  To extends StateFromFactory<States> = StateFromFactory<States>,
  Params = any[],
> = Expand<
  ChangeEvent<EventKey, From, To> & {
    params: Params;
    match: <M extends ChangeEventMatchers<States, Transitions>>(
      cases: M,
    ) => M[keyof M] extends (...args: any) => infer R ? R : never;
  }
>;
// #endregion

// #region Matchers
type ChangeEventMatchers<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = {
  [StateKey in keyof Transitions]?: {
    [EventKey in keyof Transitions[StateKey]]: Transitions[StateKey][EventKey] extends keyof States
      ? (...args: Parameters<States[Transitions[StateKey][EventKey]]>) => any
      : (...args: any[]) => any;
  };
}[keyof Transitions] & {
  _?: (...args: any[]) => any;
};
// #endregion

// #region Transitioners
export type StateTransitions<States extends StatesFactory<any>, Transitions> = {
  [StateKey in keyof Transitions & keyof States]: {
    [EventKey in keyof Transitions[StateKey]]: Transitions[StateKey][EventKey] extends keyof States
      ? (
          ...args: Parameters<States[Transitions[StateKey][EventKey]]>
        ) => StateFromFactory<States, Transitions[StateKey][EventKey]> & {
          key: Transitions[StateKey][EventKey];
        }
      : Transitions[StateKey][EventKey] extends AdvancedFunctionStateTarget<
          States,
          EventKey
        >
      ? (
          ...args: Parameters<Transitions[StateKey][EventKey]>
        ) => StateFromFactory<States> & { key: Transitions[StateKey][EventKey] }
      : Transitions[StateKey][EventKey] extends FunctionStateTarget<
          StateFromFactory<States>
        >
      ? (
          ...args: Parameters<Transitions[StateKey][EventKey]>
        ) => StateFromFactory<States> & { key: Transitions[StateKey][EventKey] }
      : never;
  };
};

export type StateTransitioners<
  States extends StatesFactory<any>,
  Transitions,
> = {
  [StateKey in keyof StateTransitions<States, Transitions>]: {
    [EventKey in keyof StateTransitions<States, Transitions>[StateKey]]: (
      ...args: Parameters<
        StateTransitions<States, Transitions>[StateKey][EventKey]
      >
    ) => void;
  };
};

// KEEP
export type FlattenedEventTypes<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = {
  [StateKey in keyof StateTransitioners<
    States,
    Transitions
  >]: keyof StateTransitioners<States, Transitions>[StateKey];
}[keyof StateTransitioners<States, Transitions>];

// Utility type to get the value types of an object
type ValueTypes<T> = T[keyof T];

// Provides only the keys that are valid for the given state-event transitions
export type FlattenReturnStateTargetKeys<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = ValueTypes<{
  [StateKey in keyof StateTransitions<States, Transitions>]: {
    [EventKey in keyof StateTransitions<
      States,
      Transitions
    >[StateKey]]: StateTransitions<
      States,
      Transitions
    >[StateKey][EventKey] extends (...args: any[]) => infer TargetState
      ? TargetState extends StateFromFactory<States>
        ? TargetState["key"] extends keyof States
          ? TargetState["key"]
          : never
        : never
      : never;
  }[keyof StateTransitions<States, Transitions>[StateKey]];
}>;

// KEEP
export type FlattenReturnStateTargets<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = ValueTypes<{
  [StateKey in keyof StateTransitions<States, Transitions>]: {
    [EventKey in keyof StateTransitions<
      States,
      Transitions
    >[StateKey]]: StateTransitions<
      States,
      Transitions
    >[StateKey][EventKey] extends (...args: any[]) => infer TargetState
      ? TargetState extends StateFromFactory<States, infer TargetStateKey>
        ? TargetStateKey extends keyof States
          ? TargetState
          : never
        : never
      : never;
  }[keyof StateTransitions<States, Transitions>[StateKey]];
}>;

// #endregion

// #endregion

// #region Utility
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

export type TUnionToIntersection<T> = (
  T extends any ? (x: T) => any : never
) extends (x: infer R) => any
  ? R
  : never;

// #endregion

// KEEP
export type FlattenMembers<T> = {
  [StateKey in keyof T]: T[StateKey];
}[keyof T];

// KEEP
export type FlatMemberUnionToIntersection<T> = TUnionToIntersection<
  FlattenMembers<T>
>;

export type StateTransitionTargets<
  States extends StatesFactory<any>,
  Transitions,
> = {
  [StateKey in keyof StateTransitions<States, Transitions>]: {
    [EventKey in keyof StateTransitions<
      States,
      Transitions
    >[StateKey]]: ReturnType<
      StateTransitions<States, Transitions>[StateKey][EventKey]
    >;
  };
};

// KEEP
export type FlatStateTransitionTargets<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = FlattenMembers<StateTransitionTargets<States, Transitions>>;

// #region Lifecycle

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
      FlattenedEventTypes<States, Transitions>,
      // source state
      StateFromFactory<
        States,
        StateKey extends "*" ? keyof States : StateKey
      >,
      // target state
      StateFromFactory<States>
    >,
  ) => any;
  enter?: (
    change: StateMachineEvent<
      States,
      Transitions,
      FlattenedEventTypes<States, Transitions>,
      // from any state
      StateFromFactory<States> & { key: keyof States },
      // to this state
      StateFromFactory<
        States,
        StateKey extends "*" ? keyof States : StateKey
      >
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
          | FlattenedEventTypes<States, Transitions>
          | "*"]?: TransitionHookExtensions<
          StateMachineEvent<
            States,
            Transitions,
            AnyStateEvent extends "*"
              ? FlattenedEventTypes<States, Transitions>
              : AnyStateEvent,
            // Source State
            StateFromFactory<States> & {
              key: keyof {
                [K in keyof Transitions]: AnyStateEvent extends keyof Transitions[K]
                  ? K
                  : keyof Transitions;
              };
            },
            // Target State
            AnyStateEvent extends "*"
              ? // Wildcard Event inside Wildcard State, return all possible targets
                FlattenReturnStateTargets<
                  States,
                  Transitions
                > extends StateFromFactory<States>
                ? FlattenReturnStateTargets<States, Transitions>
                : never
              : // Specific Event inside Wildcard State. Filter to possible targets
              AnyStateEvent extends keyof TUnionToIntersection<
                  FlatStateTransitionTargets<States, Transitions>
                >
              ? TUnionToIntersection<
                  FlatStateTransitionTargets<States, Transitions>
                >[AnyStateEvent] extends StateFromFactory<States>
                ? TUnionToIntersection<
                    FlatStateTransitionTargets<States, Transitions>
                  >[AnyStateEvent]
                : never
              : never,
            any[] // could be union of all possible params lol I'm tired
          >
        >;
      }
    : // VALID Transition Source State Key
      {
        [Event in keyof Transitions[StateKey] | "*"]?: Event extends "*"
          ? // wildcard events for specific state
            TransitionHookExtensions<
              StateMachineEvent<
                States,
                Transitions,
                keyof Transitions[StateKey],
                StateFromFactory<States, StateKey> & { key: StateKey },
                StateFromFactory<States> & {
                  key: keyof Transitions[StateKey];
                },
                any[]
              >
            >
          : // specific event for specific state
          Transitions[StateKey][Event] extends keyof States
          ? TransitionHookExtensions<
              StateMachineEvent<
                States,
                Transitions,
                Event, // should constrain params
                StateFromFactory<States, StateKey> & { key: StateKey },
                StateFromFactory<States, Transitions[StateKey][Event]> & {
                  key: Transitions[StateKey][Event];
                },
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
// #endregion
