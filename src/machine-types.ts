import { FuncEnhancer } from "./extras/methodware";
import { UpdateMethodEnhancer } from "./extras/on-update";
import {
  CreateFunc,
  SwapFunc,
  ChangeEvent,
  FlatMemberUnionToIntersection,
  Members,
  TUnionToIntersection,
  FlatMemberUnion,
  Func,
} from "./types";

// #region Transition Config

export type AState = { key: string; [prop: string]: any };
export type AnEvent = { type: string };
export type AParams = any[];

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
  def: StateMachineDefinition<States, any>,
  machine?: StateMachine<States, any>,
) => StateFromFactory<States>;
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
  // event: FlatEventSenders<States, Transitions>;
  getChange: () => StateMachineEvent<States, Transitions>;
  reset(): void; // remove// externalize
  update: SwapFunc<StateMachineEvent<States, Transitions>>;
  // use: (
  //   ...updateEnhancers: FuncEnhancer<
  //     SwapFunc<StateMachineEvent<States, Transitions>>
  //   >[]
  // ) => () => void;
}

export type SendFunction<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = <EventKey extends string & FlatEventKeys<States, Transitions>>(
  event: EventKey,
  ...params: StateEventTransitionSenders<
    States,
    Transitions
    // eslint-disable-next-line @typescript-eslint/ban-types
  >[keyof Transitions][EventKey] extends Func<any[], any>
    ? Parameters<
        StateEventTransitionSenders<
          States,
          Transitions
        >[keyof Transitions][EventKey]
      >
    : any[]
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
> = {
  create: StateMachineCreator<States, Transitions>;
  states: States;
  transitions: Transitions;
};
// #endregion
// #region State Machine Event
export type StateMachineEvent<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
  EventKey extends string & FlatEventKeys<States, Transitions> = string &
    FlatEventKeys<States, Transitions>,
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
export type ChangeEventMatchers<
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

export type StateEventTransitionFunc<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
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
  // ? (
  //     ...args: Parameters<States[Transitions[TransitionStateKey][EventKey]]>
  //   ) => StateFromFactory<States, Transitions[TransitionStateKey][EventKey]>
  // : Transitions[TransitionStateKey][EventKey] extends (
  //     ...args: infer A
  //   ) => (...innerArgs: any[]) => infer R
  // ? /*
  //   Hey AI, we are trying to make this clause work.

  //   This:
  //   Transitions[TransitionStateKey][EventKey] extends (
  //     ...args: any[]
  //   ) => (...args: any[]) => StateFromFactory<States> should match and return

  //   (
  //     ...args: Parameters<Transitions[TransitionStateKey][EventKey]>
  //   ) => ReturnType<ReturnType<Transitions[TransitionStateKey][EventKey]>>

  //   There are no places in my usage code where it should return never, but it is not matching.

  //   We want to be able to use a two-phase transition function.
  //   A function that returns a function that returns a valid state

  //   For transitions like:
  //   {
  //     done: "Done",
  //     doneAdvFunc: (done: string) => (_, event, def) => {
  //       return def.states[done === "DONE" ? "Done" : "Initial"](
  //         event === "doneAdvFunc",
  //       );
  //     },
  //   }
  //   The above code works fine which
  //   The typescript correctly picks up all of the keys but not the returns, as in this type info:

  //   event: {
  //       done: (ok: boolean, msg?: string | undefined) => void;
  //       doneAdvFunc: (...args: never) => void;
  //   } & {}

  //   */
  //   (umm: { uum: string }) => R
  // :  (umm: { uum: string }) => { whaterver: boolean};
};
export type StateEventTransitionFuncs<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = {
  [TransitionStateKey in keyof Transitions]: StateEventTransitionFunc<
    States,
    Transitions,
    TransitionStateKey
  >;
};

export type StateEventTransitionSenders<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
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
export type FlatEventSenders<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
> = FlatMemberUnionToIntersection<
  StateEventTransitionSenders<States, Transitions>
>;

export type FlatEventKeys<
  States extends StatesFactory,
  Transitions extends TransitionConfig<States>,
> = string &
  {
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
  Transitions extends TransitionConfig<States>,
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

// export type AnyStates = StatesFactory<any>;
// export type AnyStateKey = keyof AnyStates;
// export type AnyTransitions = TransitionConfig<any>;

// export type AnyEvent = StateMachineEvent<any, any>;
// export type AnyEventType = AnyEvent["type"];
// export type AnyState = StateFromFactory<any>;
// export type AnyMachine = StateMachine<any, any>;
// export type AnyMachineStateKey = keyof AnyMachine["def"]["states"];
// export type AnyDefinition = StateMachineDefinition<any, any>;
