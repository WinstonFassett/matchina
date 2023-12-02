import { Middleware } from "../v1/extras/middleware";
import {
  FlatMemberUnion,
  FlatMemberUnionToIntersection,
  Members,
  Simplify,
  TUnionToIntersection,
} from "../../types";

//#region machine
interface SimpleStateMachine<E extends AnyMachineChangeEvent> {
  getState(): E["to"] | E["from"];
  getChange(): E;
  send(type: E["type"], ...params: E["params"]): void;
}
// type StatesRecord<K extends string, S extends State> = Record<K, S>

export interface StateMachine<
  TC extends TransitionConfig<SF>,
  SF extends AnyStatesFactory,
  E extends StateTransitionEvent<TC, SF> = StateTransitionEvent<TC, SF>,
> {
  getState(): E["to"] | E["from"];
  getChange(): E;
  send: SendFunction<TC, SF>;
  api: Simplify<FlatEventSenders<TC, SF>>; // implement later
  senders: StateEventTransitionSenders<TC, SF>; // debugging. remove later
}

type Effect<E> = (event: E) => void;

export interface MinimalMachineContext<
  SF extends AnyStatesFactory,
  I extends StateFromFactory<SF>,
  TC extends TransitionConfig<SF>,
> {
  states: SF;
  initialState: I;
  transitions: TC;
}

export type CreateStateChangeMachineProps<SF extends AnyStatesFactory> =
  Partial<StateChangeMachineInternals<any, any, any>>;

//#endregion

//#region states
export type AnyStatesFactory = Record<string, (...params: any[]) => State>;

export type StateFromFactory<
  States extends AnyStatesFactory,
  StateKey extends keyof States = keyof States,
> = ReturnType<States[StateKey]>;

export interface State<K extends string = string, D = any> {
  key: K;
  data: D; // TODO: make data optional
}
//#endregion

export type TransitionRecord = Record<
  string,
  Record<string, (...args: any[]) => any>
>;

//#region events

export interface ChangeEvent<Type, To, From> {
  type: Type;
  to: To;
  from: From;
}

export interface ChangeMachineEvent<
  Type,
  To,
  From,
  Params extends any[] = any[],
> {
  // extends ChangeEvent<Type, To, From>
  type: Type;
  to: To;
  from: From;
  params: Params;
}
export type AnyMachineChangeEvent = ChangeMachineEvent<any, any, any, any>;

export interface StateChangeMachineEvent<
  Type extends string,
  To extends State,
  From extends State,
  Params extends any[] = any[],
> extends ChangeMachineEvent<Type, To, From, Params> {}

type ResolveEvent<E extends MachineContextEvent<any, any[]>> = Omit<E, "to"> & {
  machine: StateMachine<any, any, E>;
};

export type StateTransitionEvent<
  TC extends TransitionConfig<SF>,
  SF extends AnyStatesFactory,
> = MachineContextEvent<StateChangeMachineTransitionContext<TC, SF>>;

export type TransitionConfig<
  SF extends AnyStatesFactory,
  CP extends any[] = any[],
> = {
  [FromStateKey in string & keyof SF]: {
    [EventKey in string]:
      | keyof SF
      | ((...params: any[]) => StateFromFactory<SF>)
      | ((...params: any[]) => (...context: CP) => StateFromFactory<SF>);
  };
};

export interface MachineContextEvent<
  Context extends StateChangeMachineTransitionContext<any, any>,
  CP extends any[] = any[],
> extends StateChangeMachineEvent<
    string & FlatEventKeys<Context["transitions"]>,
    FlatExitStates<Context["transitions"], Context["states"]>,
    FlatEntryStates<Context["transitions"], Context["states"]>,
    CP
  > {}

//#endregion

//#region internals

export interface StoreInternals<T> {
  get(): T;
  set(value: T): void;
}
interface TransitionInternals<E extends AnyMachineChangeEvent> {
  resolve: ResolveTransition<E>;
  guard: (event: E) => boolean;
  handle: (event: E) => E | undefined;
}
interface StateChangeNotifyInternals<E> {
  enter: (event: E) => void;
  exit: (event: E) => void;
}

export interface StateChangeMachineTransitionContext<
  TC extends TransitionConfig<SF>,
  SF extends AnyStatesFactory,
> {
  states: SF;
  transitions: TC;
}

interface ChangeMachineInternals<Event extends AnyMachineChangeEvent>
  extends TransitionInternals<Event>,
    StateChangeNotifyInternals<Event> {
  store: StoreInternals<Event>;
  transition?: (event: Event) => Event | undefined;
}

export interface StateChangeMachineInternals<
  TC extends TransitionConfig<States>,
  States extends AnyStatesFactory,
  Event extends ChangeMachineEvent<
    any,
    StateFromFactory<States>,
    StateFromFactory<States>,
    any
  > = ChangeMachineEvent<
    any,
    StateFromFactory<States>,
    StateFromFactory<States>,
    any
  >,
> extends ChangeMachineInternals<Event>,
    StateChangeNotifyInternals<Event>,
    StateChangeMachineTransitionContext<TC, States> {
  states: States;
  transitions: TC;
  store: StoreInternals<Event>;
  transition?: (event: Event) => Event | undefined;
}

//#endregion

//#region mapped types

export type FlatEventKeys<T> = {
  [K in keyof T]: keyof T[K];
}[keyof T];

export type StateEventTransitionFunc<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
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
      : Transitions[TransitionStateKey][EventKey] extends (
            ...any: []
          ) => StateFromFactory<States>
        ? (
            ...args: Parameters<Transitions[TransitionStateKey][EventKey]>
          ) => StateFromFactory<States> & {
            key: Transitions[TransitionStateKey][EventKey];
          }
        : never;
};

export type StateEventTransitionFuncs<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
> = {
  [TransitionStateKey in keyof Transitions]: StateEventTransitionFunc<
    Transitions,
    States,
    TransitionStateKey
  >;
};

export type FlatExitStates<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
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

export type FilterEmptyRecordKeys<T> = {
  [K in keyof T]: keyof T[K] extends never ? never : K;
}[keyof T];

export type FlatEntryStates<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
  BaseState extends StateFromFactory<States> = StateFromFactory<States>,
> = {
  [K in keyof Transitions]: keyof Transitions[K] extends never
    ? never
    : K extends keyof States
      ? ReturnType<States[K]>
      : never;
}[keyof Transitions];

export type StatesToEventsToStates<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
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
  States extends AnyStatesFactory,
> = TUnionToIntersection<
  FlatMemberUnion<StatesToEventsToStates<Transitions, States>>
>;

export type StateEventTransitionSenders<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
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
  States extends AnyStatesFactory,
> = FlatMemberUnionToIntersection<
  StateEventTransitionSenders<Transitions, States>
>;

export type TransitionRecordParameters<T> = {
  [K in keyof T]: T[K] extends Record<string, (...args: infer P) => any>
    ? P
    : never;
}[keyof T];

export type TransitionRecordParametersForEvent<T, FuncKey extends keyof any> = {
  [OuterKey in keyof T]: FuncKey extends keyof T[OuterKey]
    ? T[OuterKey][FuncKey] extends (...args: infer P) => any
      ? P
      : never
    : never;
}[keyof T];

export type SendFunction<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
> = <EventKey extends string & FlatEventKeys<Transitions>>(
  event: EventKey,
  ...params: TransitionRecordParametersForEvent<
    StateEventTransitionSenders<Transitions, States>,
    EventKey
  >
) => void;
export type ResolveTransition<E extends AnyMachineChangeEvent> = (
  event: ResolveEvent<E>,
) => E | undefined;

//#endregion

//#region internal phases

export type StateMachineHooks<E extends AnyMachineChangeEvent> = {
  resolve?: Middleware<ResolveEvent<E>>;
  guard?: Middleware<E>;
  handle?: Middleware<E>;
  enter?: Effect<E>;
  exit?: Effect<E>;
};

export type Phase = "guard" | "handle" | "enter" | "exit"; // also resolve
export const Phases = ["guard", "handle", "enter", "exit"]; // also resolve

export type PhaseInternals<E> = {
  phases: {
    [P in Phase]?: Middleware<E>[];
  } & {
    __cleanup: () => void;
  };
};

//#endregion
