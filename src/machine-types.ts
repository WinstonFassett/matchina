import { FuncEnhancer } from "./extras/methodware";
import { Middleware } from "./extras/middleware";
import {
  ChangeEvent,
  CreateFunc,
  FlatMemberUnion,
  FlatMemberUnionToIntersection,
  Func,
  Members,
  SwapFunc,
  TUnionToIntersection,
} from "./types";

// #region Transition Config

export type AState = { key: string; [prop: string]: any };
export type AnEvent = { type: string };
export type AParams = any[];

interface FunctionalStateMachineKernel<
  T,
  E extends string = string,
  P extends any[] = any[],
> {
  getState<T>(): T;
  send<T>(event: E, ...params: P[]): void;
}

export type StateChangeMachine<E> = {
  getChange: () => E;
  update: SwapFunc<E>;
};

interface EventfulStateMachineKernel<T, E, P> {
  getState<T>(): T;
  send<T>(event: E, param: P): void;
}

interface ChangeMachine<Event, To, From = To> {
  getChange(): ChangeEvent<Event, From, To>;
}

interface Resettable {
  reset(): void;
}
interface Usable<F extends Func> {
  use(...mw: Middleware<F>[]): void;
}

export type StatesFactory<T = any> = {
  [key: string]: (...args: any[]) => T;
};
export type StateFromFactory<
  States extends StatesFactory,
  K extends keyof States = keyof States,
> = ReturnType<States[K]>;

export type TransitionConfig<States extends StatesFactory> = {
  [SourceState in keyof States & string]: {
    [EventKey in string]:
      | keyof States
      | CreateFunc<StateFromFactory<States>>
      | TwoPhaseTransitionToStateFunc<States, SourceState, EventKey>;
  } & Record<string, unknown>;
} & Record<string, unknown>;

type TwoPhaseTransitionToStateFunc<
  States extends StatesFactory,
  StateKey extends keyof States,
  EventKey extends string = string,
> = (
  ...args: any[]
) => (
  sourceState: StateFromFactory<States, StateKey>,
  eventType: EventKey,
  def: StateMachineDefinition<any, States>,
  machine?: StateMachine<any, States>,
) => StateFromFactory<States>;
// #endregion
// #region StateMachine

export interface StateMachine<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory,
> {
  context: StateMachineContext<Transitions, States>; // consolidate with def?
  getState: () => StateFromFactory<States>;
  send: SendFunction<Transitions, States>;
  getChange: () => StateMachineEvent<Transitions, States>;
  reset(): void; // remove// externalize
  update: SwapFunc<StateMachineEvent<Transitions, States>>;
}

export interface StateMachineProtected<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory,
> {
  reset(): void; // remove// externalize
  update: SwapFunc<StateMachineEvent<Transitions, States>>;
}

export type SendFunction<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory<any>,
> = <EventKey extends string & FlatEventKeys<Transitions, States>>(
  event: EventKey,
  ...params: StateEventTransitionSenders<
    Transitions,
    States
  >[keyof Transitions][EventKey] extends Func<any[], any>
    ? Parameters<
        StateEventTransitionSenders<
          Transitions,
          States
        >[keyof Transitions][EventKey]
      >
    : any[]
) => void;

export type StateMachineCreator<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory,
> = (
  initialState: StateFromFactory<States> | keyof States,
) => StateMachine<Transitions, States>;

export type UpdateEnhancer<T> = FuncEnhancer<SwapFunc<T>>;

export type StateMachineContext<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory,
> = {
  states: States;
  transitions: Transitions;
  initialState: keyof States | StateFromFactory<States>;
};

export type StateMachineDefinition<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory,
> = {
  create: StateMachineCreator<Transitions, States>;
  states: States;
  transitions: Transitions;
};
export type MatchEvent<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory,
> = <M extends ChangeEventMatchers<Transitions, States>>(
  cases: M,
) => M[keyof M] extends (...args: any) => infer R ? R : never;

// #endregion
// #region State Machine Event
export type StateMachineEvent<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory,
  EventKey extends string & FlatEventKeys<Transitions, States> = string &
    FlatEventKeys<Transitions, States>,
  From extends StateFromFactory<States> = StateFromFactory<States>,
  To extends StateFromFactory<States> = StateFromFactory<States>,
  Params = any[],
> = ChangeEvent<EventKey, From, To> & {
  params: Params;
  match: MatchEvent<Transitions, States>;
};
// >;
export type ChangeEventMatchers<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory,
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

export type StateEventTransitionFunc<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory<any>,
  TransitionStateKey extends keyof Transitions,
> = {
  [EventKey in keyof Transitions[TransitionStateKey] &
    string]: Transitions[TransitionStateKey][EventKey] extends keyof States
    ? (
        ...args: Parameters<States[Transitions[TransitionStateKey][EventKey]]>
      ) => StateFromFactory<States, Transitions[TransitionStateKey][EventKey]>
    : Transitions[TransitionStateKey][EventKey] extends (
          ...args: infer A
        ) => (...innerArgs: any[]) => infer R
      ? (...args: A) => R
      : Transitions[TransitionStateKey][EventKey] extends CreateFunc<
            StateFromFactory<States>
          >
        ? (
            ...args: Parameters<Transitions[TransitionStateKey][EventKey]>
          ) => StateFromFactory<States> & {
            key: Transitions[TransitionStateKey][EventKey];
          }
        : never;
};
export type StateEventTransitionFuncs<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory<any>,
> = {
  [TransitionStateKey in keyof Transitions]: StateEventTransitionFunc<
    Transitions,
    States,
    TransitionStateKey
  >;
};

export type StateEventTransitionSenders<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory<any>,
> = {
  [StateKey in keyof StateEventTransitionFuncs<Transitions, States>]: {
    [EventKey in keyof StateEventTransitionFuncs<
      Transitions,
      States
    >[StateKey]]: (
      ...args: Parameters<
        StateEventTransitionFuncs<Transitions, States>[StateKey][EventKey]
      >
    ) => void;
  };
};
export type FlatEventSenders<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory<any>,
> = FlatMemberUnionToIntersection<
  StateEventTransitionSenders<Transitions, States>
>;

export type FlatEventKeys<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory<any>,
> = string &
  {
    [StateKey in keyof StateEventTransitionFuncs<
      Transitions,
      States
    >]: keyof StateEventTransitionFuncs<Transitions, States>[StateKey];
  }[keyof StateEventTransitionFuncs<Transitions, States>];
// provides the return types of all state-event transitions

export type FlatExitStates<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory<any>,
> = Members<{
  [StateKey in keyof StateEventTransitionFuncs<Transitions, States>]: {
    [EventKey in keyof StateEventTransitionFuncs<
      Transitions,
      States
    >[StateKey]]: StateEventTransitionFuncs<
      Transitions,
      States
    >[StateKey][EventKey] extends (...args: any[]) => infer TargetState
      ? TargetState extends StateFromFactory<States, infer TargetStateKey>
        ? TargetStateKey extends keyof States
          ? TargetState
          : never
        : never
      : never;
  }[keyof StateEventTransitionFuncs<Transitions, States>[StateKey]];
}>;
// Provides only the keys that are valid for the given state-event transitions

export type FlatExitStateKeys<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory<any>,
> = Members<{
  [StateKey in keyof StateEventTransitionFuncs<Transitions, States>]: {
    [EventKey in keyof StateEventTransitionFuncs<
      Transitions,
      States
    >[StateKey]]: StateEventTransitionFuncs<
      Transitions,
      States
    >[StateKey][EventKey] extends (...args: any[]) => infer TargetState
      ? TargetState extends StateFromFactory<States>
        ? TargetState["key"] extends keyof States
          ? TargetState["key"]
          : never
        : never
      : never;
  }[keyof StateEventTransitionFuncs<Transitions, States>[StateKey]];
}>;

export type StatesToEventsToStates<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory<any>,
> = {
  [StateKey in keyof StateEventTransitionFuncs<Transitions, States>]: {
    [EventKey in keyof StateEventTransitionFuncs<
      Transitions,
      States
    >[StateKey]]: ReturnType<
      StateEventTransitionFuncs<Transitions, States>[StateKey][EventKey]
    >;
  };
};

export type EventExitStatesIntersection<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory<any>,
> = TUnionToIntersection<
  FlatMemberUnion<StatesToEventsToStates<Transitions, States>>
>;
