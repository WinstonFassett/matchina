import { StateFromFactory, StatesFactory } from "./states";

// #region General

export type AnyStateKey = keyof any;
export type AnyEventKey = keyof any;
export interface ChangeEvent<Type, From, To> {
  type: Type;
  from: From;
  to: To;
}
export type CreateFunc<T, P = any> = (...args: P[]) => T;
export type SwapFunc<T> = (updater: (event: T) => T) => void;

// #endregion

// #region Transition Config

export type TransitionConfig<States extends StatesFactory<any>> = {
  [SourceState in keyof States]: {
    [EventKey: AnyEventKey]:
      | keyof States
      | CreateFunc<StateFromFactory<States>>
      | TwoPhaseTransitionToStateFunc<States, SourceState, typeof EventKey>;
  };
};

type TwoPhaseTransitionToStateFunc<
  States extends StatesFactory<any>,
  SourceStateKey extends keyof States = keyof States,
  StateEventKey extends AnyEventKey = AnyEventKey,
  P = any,
> = (
  ...args: P[]
) => (
  state: StateFromFactory<States, SourceStateKey>,
  eventType: StateEventKey,
  machine: StateMachine<States, any>,
) => StateFromFactory<States>;

// #endregion

// #region StateMachine

export interface StateMachine<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> {
  def: StateMachineDefinition<States, Transitions>;
  config: {
    initialState: StateFromFactory<States>;
  }; // consolidate with def?
  getState: () => StateFromFactory<States>;
  send: SendFunction<States, Transitions>;
  event: FlatEventSenders<States, Transitions>;
  getChange: () => StateMachineEvent<States, Transitions>;
  reset(): void; // remove// externalize
  update: SwapFunc<StateMachineEvent<States, Transitions>>;
}

export type SendFunction<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = <
  E extends S extends keyof Transitions
    ? keyof StateEventTransitionSenders<States, Transitions>[S]
    : Event["type"],
  S extends keyof Transitions = keyof States,
  P = Exclude<
    S extends keyof Transitions
      ? Parameters<StateEventTransitionSenders<States, Transitions>[S][E]>[0]
      : Parameters<
          StateEventTransitionSenders<States, Transitions>[keyof States][E]
        >[0],
    undefined
  >,
>(
  event: E,
  ...params: P[]
) => void;

export type StateMachineCreator<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = (
  initialState: StateFromFactory<States>,
) => StateMachine<States, Transitions>;

export type StateMachineDefinition<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = {
  create: StateMachineCreator<States, Transitions>;
  states: States;
  transitions: Transitions;
};
// #endregion

// #region State Machine Event
export type StateMachineEvent<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
  EventKey extends FlatEventKeys<States, Transitions> = FlatEventKeys<
    States,
    Transitions
  >,
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

// #region Mapped Transitions
export type StateEventTransitionFuncs<
  States extends StatesFactory<any>,
  Transitions,
> = {
  [StateKey in keyof Transitions]: {
    [EventKey in keyof Transitions[StateKey]]: Transitions[StateKey][EventKey] extends keyof States
      ? (
          ...args: Parameters<States[Transitions[StateKey][EventKey]]>
        ) => StateFromFactory<States, Transitions[StateKey][EventKey]>
      : Transitions[StateKey][EventKey] extends TwoPhaseTransitionToStateFunc<
          States,
          StateKey,
          EventKey
        >
      ? (
          ...args: Parameters<Transitions[StateKey][EventKey]>
        ) => ReturnType<Transitions[StateKey][EventKey]>
      : Transitions[StateKey][EventKey] extends CreateFunc<
          StateFromFactory<States>
        >
      ? (
          ...args: Parameters<Transitions[StateKey][EventKey]>
        ) => ReturnType<
          Transitions[StateKey][EventKey]
        > extends StateFromFactory<States>
          ? ReturnType<Transitions[StateKey][EventKey]>
          : StateFromFactory<States>
      : never;
  };
};

export type StateEventTransitionSenders<
  States extends StatesFactory<any>,
  Transitions,
> = {
  [StateKey in keyof StateEventTransitionFuncs<States, Transitions>]: {
    [EventKey in keyof StateEventTransitionFuncs<
      States,
      Transitions
    >[StateKey]]: (
      ...args: Parameters<
        StateEventTransitionFuncs<States, Transitions>[StateKey][EventKey]
      >
    ) => void;
  };
};

type FlatEventSenders<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = FlatMemberUnionToIntersection<
  StateEventTransitionSenders<States, Transitions>
>;

export type FlatEventKeys<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = {
  [StateKey in keyof StateEventTransitionFuncs<
    States,
    Transitions
  >]: keyof StateEventTransitionFuncs<States, Transitions>[StateKey];
}[keyof StateEventTransitionFuncs<States, Transitions>];

// provides the return types of all state-event transitions
export type FlatExitStates<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = Members<{
  [StateKey in keyof StateEventTransitionFuncs<States, Transitions>]: {
    [EventKey in keyof StateEventTransitionFuncs<
      States,
      Transitions
    >[StateKey]]: StateEventTransitionFuncs<
      States,
      Transitions
    >[StateKey][EventKey] extends (...args: any[]) => infer TargetState
      ? TargetState extends StateFromFactory<States, infer TargetStateKey>
        ? TargetStateKey extends keyof States
          ? TargetState
          : never
        : never
      : never;
  }[keyof StateEventTransitionFuncs<States, Transitions>[StateKey]];
}>;

// Provides only the keys that are valid for the given state-event transitions
export type FlatExitStateKeys<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = Members<{
  [StateKey in keyof StateEventTransitionFuncs<States, Transitions>]: {
    [EventKey in keyof StateEventTransitionFuncs<
      States,
      Transitions
    >[StateKey]]: StateEventTransitionFuncs<
      States,
      Transitions
    >[StateKey][EventKey] extends (...args: any[]) => infer TargetState
      ? TargetState extends StateFromFactory<States>
        ? TargetState["key"] extends keyof States
          ? TargetState["key"]
          : never
        : never
      : never;
  }[keyof StateEventTransitionFuncs<States, Transitions>[StateKey]];
}>;

export type StatesToEventsToStates<
  States extends StatesFactory<any>,
  Transitions,
> = {
  [StateKey in keyof StateEventTransitionFuncs<States, Transitions>]: {
    [EventKey in keyof StateEventTransitionFuncs<
      States,
      Transitions
    >[StateKey]]: ReturnType<
      StateEventTransitionFuncs<States, Transitions>[StateKey][EventKey]
    >;
  };
};

export type EventExitStatesIntersection<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = TUnionToIntersection<
  FlatMemberUnion<StatesToEventsToStates<States, Transitions>>
>;

// #endregion

// #region Utility

type Members<T> = T[keyof T];

export type FlatMemberUnion<T> = {
  [StateKey in keyof T]: T[StateKey];
}[keyof T];

export type TUnionToIntersection<T> = (
  T extends any ? (x: T) => any : never
) extends (x: infer R) => any
  ? R
  : never;

export type FlatMemberUnionToIntersection<T> = TUnionToIntersection<
  FlatMemberUnion<T>
>;

export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

// #endregion
