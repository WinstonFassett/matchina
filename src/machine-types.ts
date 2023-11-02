import { StateFromFactory, StatesFactory } from "./states";
import {
  AnyEventKey,
  CreateFunc,
  SwapFunc,
  // Expand,
  ChangeEvent,
  FlatMemberUnionToIntersection,
  Members,
  TUnionToIntersection,
  FlatMemberUnion,
} from "./types";

// #region Transition Config

export type TransitionConfig<States extends StatesFactory> = {
  [SourceState in keyof States]: {
    [EventKey: AnyEventKey]:
      | keyof States
      | CreateFunc<StateFromFactory<States>>
      | TwoPhaseTransitionToStateFunc<States, SourceState>;
  };
};
type TwoPhaseTransitionToStateFunc<
  States extends StatesFactory,
  SourceStateKey extends keyof States = keyof States,
  StateEventKey extends AnyEventKey = AnyEventKey,
  P = any,
  ExitState extends StateFromFactory<States> = StateFromFactory<States>,
> = (
  ...args: P[]
) => (
  sourceState: StateFromFactory<States, SourceStateKey>,
  eventType: StateEventKey,
  def: StateMachineDefinition<States, any>,
  machine?: StateMachine<States, any>,
) => ExitState;
// #endregion
// #region StateMachine

export interface StateMachine<
  States extends StatesFactory,
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
  States extends StatesFactory,
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
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
> = (
  initialState: StateFromFactory<States>,
) => StateMachine<States, Transitions>;

export type StateMachineDefinition<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
  Event extends StateMachineEvent<States, Transitions> = StateMachineEvent<
    States,
    Transitions
  >,
> = {
  create: StateMachineCreator<States, Transitions>;
  states: States;
  transitions: Transitions;
  // IDEA: expose transition func here?
  // transition(current: Change): Change;
  transition(
    sourceState: StateFromFactory<States>,
    type: Event["type"],
    params: Event["params"],
    def: StateMachineDefinition<States, Transitions>,
    machine?: StateMachine<States, Transitions>,
  ): StateFromFactory<States> | undefined;
};
// #endregion
// #region State Machine Event
export type StateMachineEvent<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
  EventKey extends FlatEventKeys<States, Transitions> = FlatEventKeys<
    States,
    Transitions
  >,
  From extends StateFromFactory<States> = StateFromFactory<States>,
  To extends StateFromFactory<States> = StateFromFactory<States>,
  Params = any[],
> =
  //  Expand<
  ChangeEvent<EventKey, From, To> & {
    params: Params;
    match: <M extends ChangeEventMatchers<States, Transitions>>(
      cases: M,
    ) => M[keyof M] extends (...args: any) => infer R ? R : never;
  };
// >;
type ChangeEventMatchers<
  States extends StatesFactory,
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
  States extends StatesFactory,
  Transitions,
> = {
  [StateKey in keyof Transitions]: {
    [EventKey in keyof Transitions[StateKey]]: Transitions[StateKey][EventKey] extends keyof States
      ? // when it is a state key, return function that returns the state for that key
        (
          ...args: Parameters<States[Transitions[StateKey][EventKey]]>
        ) => StateFromFactory<States, Transitions[StateKey][EventKey]>
      : Transitions[StateKey][EventKey] extends TwoPhaseTransitionToStateFunc<
          States,
          StateKey,
          EventKey
        >
      ? // when it is two-phase function
        (
          ...args: Parameters<Transitions[StateKey][EventKey]> // take parameters of first phase
        ) => ReturnType<ReturnType<Transitions[StateKey][EventKey]>> // return return type of second phase
      : // not two phase
      Transitions[StateKey][EventKey] extends CreateFunc<
          StateFromFactory<States>
        >
      ? (
          ...args: Parameters<Transitions[StateKey][EventKey]>
        ) => StateFromFactory<States> & { key: Transitions[StateKey][EventKey] }
      : // not a function
        never;
  };
};

export type StateEventTransitionSenders<
  States extends StatesFactory,
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
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
> = FlatMemberUnionToIntersection<
  StateEventTransitionSenders<States, Transitions>
>;

export type FlatEventKeys<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
> = {
  [StateKey in keyof StateEventTransitionFuncs<
    States,
    Transitions
  >]: keyof StateEventTransitionFuncs<States, Transitions>[StateKey];
}[keyof StateEventTransitionFuncs<States, Transitions>];
// provides the return types of all state-event transitions

export type FlatExitStates<
  States extends StatesFactory,
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
  States extends StatesFactory,
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
  States extends StatesFactory,
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
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
> = TUnionToIntersection<
  FlatMemberUnion<StatesToEventsToStates<States, Transitions>>
>;

export type AnyStates = StatesFactory<any>;
export type AnyStateKey = keyof AnyStates;
export type AnyTransitions = TransitionConfig<any>;
export type AnyTransitionStateKey = keyof AnyTransitions;
export type AnyEvent = StateMachineEvent<any, any>;
export type AnyEventType = AnyEvent["type"];
export type AnyState = StateFromFactory<any>;
export type AnyMachine = StateMachine<any, any>;
export type AnyMachineStateKey = keyof AnyMachine["def"]["states"];
export type AnyDefinition = StateMachineDefinition<any, any>;
