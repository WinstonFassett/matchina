import { StatesFactory } from "./states";

// #region General 
export type AnyStateKey = string | number | symbol;
export type AnyEventKey = string | number | symbol;
export interface ChangeEvent<Type, From, To> {
  type: Type;
  from: From;
  to: To;
}
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

// #region StateMachine

export interface StateMachine<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
  Event extends StateMachineEvent<
    States,
    Transitions
  > = StateMachineEvent<States, Transitions>,
> {
  def: MachineDefinition<States, Transitions>;
  config: { states: States; transitions: Transitions }; //remove, get from def
  states: States;  //remove
  do: FlatMemberUnion<StateTransitioners<States, Transitions>>;  //remove// externalize
  getState: () => ReturnType<States[keyof States]>;
  getLast: () => Event; // changed? get changed?
  send: <
    E extends S extends keyof Transitions
      ? keyof StateTransitioners<States, Transitions>[S]
      : Event["type"],
    S extends keyof Transitions = keyof States,
    P = S extends keyof Transitions
      ? Parameters<StateTransitioners<States, Transitions>[S][E]>[0]
      : Parameters<StateTransitioners<States, Transitions>[keyof States][E]>[0]
  >(
    event: E,
    params?: P,
  ) => void;
  getChange: (
    event: FlattenMemberKeys<Transitions>,
    data?: any, // makeChange? whatIf? no, whatIf should be a separate function
  ) => Event | undefined;  //remove?
  reset(): void;  //remove// externalize
  update: (updater: (event: Event) => Event) => void; // protect?
}

export type MachineCreator<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = (
  initialState: ReturnType<States[keyof States]>,
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
  From extends ReturnType<States[keyof States]> = ReturnType<
    States[keyof States]
  >,
  To extends ReturnType<States[keyof States]> = ReturnType<
    States[keyof States]
  >,
  Params = any,
> = Expand<
  ChangeEvent<EventKey, From, To> & {
    params: Params;
    match: <M extends ChangeEventMatchers<States, Transitions>>(
      cases: M,
    ) => M[keyof M] extends (...args: any) => infer R ? R : never;
  }
>;
//#endregion

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

type FlattenMemberKeys<T> = {
  [K in keyof T]: keyof T[K];
}[keyof T];

type FlatMemberUnion<T> = TUnionToIntersection<
  FlattenMembers<T>
>;
// #endregion
