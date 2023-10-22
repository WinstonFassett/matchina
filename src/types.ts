import { StatesFactory } from "./states";

// #region General Machine Types
export type AnyStateKey = string | number | symbol;
export type AnyEventKey = string | number | symbol;
export interface ChangeEvent<Type, From, To> {
  type: Type;
  from: From;
  to: To;
}
// #endregion

// #region Transition Config Types
type SimpleStateTarget<T> = T;
type FunctionStateTarget<State> = (...args: any[]) => State;
type AdvancedFunctionStateTarget<
  States extends StatesFactory<any>,
  EventKey extends AnyEventKey = AnyEventKey,
> = (
  ...args: any[]
) => (
  event: EventKey,
  machine: StateMachine<States, any>,
) => ReturnType<States[keyof States]>;
type ConfigStateTransitionExit<States extends StatesFactory<any>> =
  | SimpleStateTarget<keyof States>
  | AdvancedFunctionStateTarget<States>
  | FunctionStateTarget<ReturnType<States[keyof States]>>;

export type TransitionConfig<States extends StatesFactory<any>> = {
  [StateKey in keyof States]: {
    [EventKey: AnyEventKey]: ConfigStateTransitionExit<States>;
  };
};
// #endregion

// #region Transitioner Types
export type StateTransitioners<
  States extends StatesFactory<any>,
  Transitions,
> = {
  [StateKey in keyof Transitions & keyof States]: {
    [EventKey in keyof Transitions[StateKey]]: Transitions[StateKey][EventKey] extends keyof States
      ? (...args: Parameters<States[Transitions[StateKey][EventKey]]>) => void
      : Transitions[StateKey][EventKey] extends AdvancedFunctionStateTarget<
          States,
          EventKey
        >
      ? (...args: Parameters<Transitions[StateKey][EventKey]>) => void
      : Transitions[StateKey][EventKey] extends FunctionStateTarget<
          ReturnType<States[keyof States]>
        >
      ? (...args: Parameters<Transitions[StateKey][EventKey]>) => void
      : never;
  };
};
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

type FlattenedTransitioners<Transitions> = TUnionToIntersection<
  FlattenMembers<Transitions>
>;
// #endregion

// #region Machine
export type FlattenedEventTypes<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = {
  [StateKey in keyof StateTransitioners<
    States,
    Transitions
  >]: keyof StateTransitioners<States, Transitions>[StateKey];
}[keyof StateTransitioners<States, Transitions>];

export type StateMachineTransition<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
  EventKey extends FlattenedEventTypes<
    States,
    Transitions
  > = FlattenedEventTypes<States, Transitions>,
  From extends ReturnType<States[keyof States]> = ReturnType<
    States[keyof States]
  >,
  To extends ReturnType<States[keyof States]> = ReturnType<
    States[keyof States]
  >,
  Params = any,
  // TO should use event key plus transition
> = Expand<
  ChangeEvent<EventKey, From, To> & {
    params: Params;
    match: <M extends ChangeEventMatchers<States, Transitions>>(
      cases: M,
    ) => M[keyof M] extends (...args: any) => infer R ? R : never;
  }
>;

export interface StateMachine<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
  Change extends StateMachineTransition<
    States,
    Transitions
  > = StateMachineTransition<States, Transitions>,
> {
  def: MachineDefinition<States, Transitions>;
  config: { states: States; transitions: Transitions };
  states: States;
  do: FlattenedTransitioners<StateTransitioners<States, Transitions>>;
  getState: () => ReturnType<States[keyof States]>;
  getLast: () => Change;
  send: (event: FlattenMemberKeys<Transitions>, ...args: any[]) => void;
  getChange: (
    event: FlattenMemberKeys<Transitions>,
    data?: any,
  ) => Change | undefined;
  reset(): void;
  update: (updater: (event: Change) => Change) => void;
}
export type AnyStateMachine<States extends StatesFactory<any>> = StateMachine<
  States,
  TransitionConfig<States>
>;

export type MachineDefinition<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = {
  create: MachineCreator<States, Transitions>;
  states: States;
  transitions: Transitions;
};
type MachineCreator<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = (
  initialState: ReturnType<States[keyof States]>,
) => StateMachine<States, Transitions>;
// #endregion

// #region Utility Types
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

export type TUnionToIntersection<T> = (
  T extends any ? (x: T) => any : never
) extends (x: infer R) => any
  ? R
  : never;

type FlattenMembers<T> = {
  [StateKey in keyof T]: T[StateKey];
}[keyof T];

type FlattenMemberKeys<T> = {
  [K in keyof T]: keyof T[K];
}[keyof T];
// #endregion
