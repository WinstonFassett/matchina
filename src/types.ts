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
  event: FlatMemberUnion<StateTransitioners<States, Transitions>>;
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
        ) => StateFromFactory<States> & { key: Transitions[StateKey][EventKey] }
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

export type StateTransitionTargetKeys<
  States extends StatesFactory<any>,
  Transitions,
> = {
  [StateKey in keyof StateTransitions<States, Transitions>]: {
    [EventKey in keyof StateTransitions<
      States,
      Transitions
    >[StateKey]]: ReturnType<
      StateTransitions<States, Transitions>[StateKey][EventKey]
    >["key"];
  };
};

export type FlattenedEventTypes<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = {
  [StateKey in keyof StateTransitioners<
    States,
    Transitions
  >]: keyof StateTransitioners<States, Transitions>[StateKey];
}[keyof StateTransitioners<States, Transitions>];

// #endregion

// #region Utility
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

export type TUnionToIntersection<T> = (
  T extends any ? (x: T) => any : never
) extends (x: infer R) => any
  ? R
  : never;

type FlattenMembers<T> = {
  [StateKey in keyof T]: T[StateKey];
}[keyof T];

export type FlattenMemberKeys<T> = {
  [K in keyof T]: keyof T[K];
}[keyof T];

type FlatMemberUnion<T> = TUnionToIntersection<FlattenMembers<T>>;
// #endregion

export type FlatMachineEvents<M extends StateMachine<StatesFactory<any>, any>> =
  FlatMemberUnion<
    StateTransitions<M["def"]["states"], M["def"]["transitions"]>
  >;

export type FlatMachineEventTargets<
  M extends StateMachine<StatesFactory<any>, any>,
> = FlatMemberUnion<
  StateTransitionTargets<M["def"]["states"], M["def"]["transitions"]>
>;

export type FlatMachineEventTargetKeys<
  M extends StateMachine<StatesFactory<any>, any>,
> = FlatMemberUnion<
  StateTransitionTargetKeys<M["def"]["states"], M["def"]["transitions"]>
>;

export type FlatEventers<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = FlatMemberUnion<StateTransitioners<States, Transitions>>;

export type FlatMachineEventers<
  M extends StateMachine<StatesFactory<any>, any>,
> = FlatEventers<M["def"]["states"], M["def"]["transitions"]>;
