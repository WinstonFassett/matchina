import { StateCreators } from "./states";
import { Expand } from "./utility-types";

// #region General Machine Types
export type AStateKey = string | number | symbol;
export type AnEventKey = string | number | symbol;
export interface TransitionEvent<Event, From, To> {
  event: Event;
  from: From;
  to: To;
}
export interface AnyMachine<
  State = any,
  EventKey extends AnEventKey = AnEventKey,
  Event extends TransitionEvent<EventKey, State, State> = TransitionEvent<
    EventKey,
    State,
    State
  >,
> {
  getState: () => State;
  send: (event: EventKey, ...args: any[]) => void;
  transition: (event: EventKey, data?: any) => Event | undefined;
  update: (updater: (event: Event) => Event) => void;
  getLast: () => Event;
}
// #endregion

// #region Transition Config Types
type SimpleStateTarget<T> = T;
type FunctionStateTarget<State> = (...args: any[]) => State;
type AdvancedFunctionStateTarget<State> = (
  ...args: any[]
) => (event: any) => State;
type ConfigStateTransitionExit<States extends StateCreators<any>> =
  | SimpleStateTarget<keyof States>
  | AdvancedFunctionStateTarget<ReturnType<States[keyof States]>>
  | FunctionStateTarget<ReturnType<States[keyof States]>>;

export type StateTransitionsConfig<States extends StateCreators<any>> = {
  [StateKey in keyof States]: {
    [EventKey: AnEventKey]: ConfigStateTransitionExit<States>;
  };
};
// #endregion

// #region Transitioner Types
export type StateTransitioners<
  States extends StateCreators<any>,
  Transitions,
> = {
  [StateKey in keyof Transitions & keyof States]: {
    [EventKey in keyof Transitions[StateKey]]: Transitions[StateKey][EventKey] extends keyof States
      ? (...args: Parameters<States[Transitions[StateKey][EventKey]]>) => void
      : Transitions[StateKey][EventKey] extends AdvancedFunctionStateTarget<
          ReturnType<States[keyof States]>
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
type TransitionEventMatchers<
  States extends StateCreators<any>,
  TransitionsConfig extends StateTransitionsConfig<States>,
> = {
  [StateKey in keyof TransitionsConfig]?: {
    [EventKey in keyof TransitionsConfig[StateKey]]: TransitionsConfig[StateKey][EventKey] extends keyof States
      ? (
          ...args: Parameters<States[TransitionsConfig[StateKey][EventKey]]>
        ) => any
      : (...args: any[]) => any;
  };
}[keyof TransitionsConfig] & {
  _?: (...args: any[]) => any;
};

type EventMatchers<
  States extends StateCreators<any>,
  TransitionsConfig extends StateTransitionsConfig<States>,
> = TransitionEventMatchers<States, TransitionsConfig>;

type MachineEvents<Transitions> = TUnionToIntersection<
  FlattenMembers<Transitions>
>;
// #endregion

// #region Machine
export type ExtractedEventKeys<
  States extends StateCreators<any>,
  Transitions extends StateTransitionsConfig<States>,
> = {
  [StateKey in keyof StateTransitioners<
    States,
    Transitions
  >]: keyof StateTransitioners<States, Transitions>[StateKey];
}[keyof StateTransitioners<States, Transitions>];

export type MachineEvent<
  States extends StateCreators<any>,
  Transitions extends StateTransitionsConfig<States>,
  EventKey extends ExtractedEventKeys<States, Transitions> = ExtractedEventKeys<
    States,
    Transitions
  >,
  From extends ReturnType<States[keyof States]> = ReturnType<
    States[keyof States]
  >,
  To extends ReturnType<States[keyof States]> = ReturnType<
    States[keyof States]
  >,
  Params = any,
  // TO should use event key plus transition
> = Expand<
  TransitionEvent<EventKey, From, To> & {
    params: Params;
    match: <M extends EventMatchers<States, Transitions>>(
      cases: M,
    ) => M[keyof M] extends (...args: any) => infer R ? R : never;
  }
>;

export interface StateMachine<
  States extends StateCreators<any>,
  TransitionConfig extends StateTransitionsConfig<States>,
  Event extends MachineEvent<States, TransitionConfig> = MachineEvent<
    States,
    TransitionConfig
  >,
> {
  config: { states: States; transitions: TransitionConfig };
  states: States;
  events: MachineEvents<StateTransitioners<States, TransitionConfig>>;
  transitions: StateTransitioners<States, TransitionConfig>;
  getState: () => ReturnType<States[keyof States]>;
  getLast: () => Event;
  send: (
    event: FlattenMemberKeys<TransitionConfig> | AnEventKey,
    ...args: any[]
  ) => void;
  transition: (
    event: FlattenMemberKeys<TransitionConfig> | AnEventKey,
    data?: any,
  ) => Event | undefined;
  reset(): void;
  update: (updater: (event: Event) => Event) => void;
}

export type MachineDefinition<
  States extends StateCreators<any>,
  Transitions extends StateTransitionsConfig<States>,
> = {
  create: MachineCreator<States, Transitions>;
  states: States;
  transitions: Transitions;
};
type MachineCreator<
  States extends StateCreators<any>,
  Transitions extends StateTransitionsConfig<States>,
> = (
  initialState: ReturnType<States[keyof States]>,
) => StateMachine<States, Transitions>;
// #endregion

// #region Utility Types
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
