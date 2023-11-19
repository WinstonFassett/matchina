import { Middleware } from "../extras/middleware";
import { FlatMemberUnion, FlatMemberUnionToIntersection, Members, Simplify, TUnionToIntersection } from "../types";
interface SimpleStateMachine<E extends AnyMachineChangeEvent> {
  getState(): E["to"] | E["from"];
  getChange(): E;
  send(type: E["type"], ...params: E["params"]): void;
}

// type StatesRecord<K extends string, S extends State> = Record<K, S>

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

type ConfiguredTransitions<Config, SR> = {
  [S in keyof Config]: {
    [E in keyof Config[S]]: Config[S][E] extends keyof SR // state key
      ? SR[Config[S][E]]
      : // func that returns a state
      Config[S][E] extends (...params: any[]) => (...params: any[]) => any
      ? ReturnType<ReturnType<Config[S][E]>>
      : // func that returns a func that takes context params and returns a state
      Config[S][E] extends (...params: any[]) => any
      ? ReturnType<Config[S][E]>
      : never;
  };
};

interface State<K extends string = string, D = any> {
  key: K;
  data: D;
}

interface ChangeEvent<Type, To, From> {
  type: Type;
  to: To;
  from: From;
}
type AnyChangeEvent = ChangeEvent<any, any, any>;

interface ChangeMachineEvent<Type, To, From, Params extends any[] = any[]> {
  // extends ChangeEvent<Type, To, From>
  type: Type;
  to: To;
  from: From;
  params: Params;
}
type AnyMachineChangeEvent = ChangeMachineEvent<any, any, any, any>;

export interface StateChangeMachineEvent<
  Type extends string,
  To extends State,
  From extends State,
  Params extends any[] = any[],
> extends ChangeMachineEvent<Type, To, From, Params> {}

interface StoreInternals<T> {
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

interface StateChangeMachineTransitionContext<
  TC extends TransitionConfig<SF>,
  SF extends AnyStatesFactory,
> {
  states: SF;
  transitions: TC;
}

export interface StateMachine<
  TC extends TransitionConfig<SF>,
  SF extends AnyStatesFactory,
  E extends StateTransitionEvent<TC, SF> = StateTransitionEvent<TC, SF>
> {
  getState(): E["to"] | E["from"];
  getChange(): E;
  // send(type: E['type'], ...params: E['params']): void
  send: SendFunction<TC, SF>;
  api: Simplify<FlatEventSenders<TC, SF>>;
  senders: StateEventTransitionSenders<TC, SF>;
}

export type StateTransitionEvent<TC extends TransitionConfig<SF>, SF extends AnyStatesFactory> = MachineContextEvent<StateChangeMachineTransitionContext<TC, SF>>;

interface StateChangeMachineTransitionRuntimeContext<
  SF extends AnyStatesFactory,
  TC extends TransitionConfig<SF>,
  E extends StateTransitionEvent<TC, SF>,
  M extends StateMachine<TC, SF, E>,
> extends StateChangeMachineTransitionContext<TC, SF> {
  machine: M;
}

interface MachineContextEvent<
  Context extends StateChangeMachineTransitionContext<any, any>,
  CP extends any[] = any[],
> extends StateChangeMachineEvent<
    string & FlatEventKeys<Context["transitions"]>, // flat event keys from context.transitions
    StateFromFactory<Context["states"]>,
    StateFromFactory<Context["states"]>,
    CP
  > {
  // match
}

interface ChangeMachineInternals<Event extends AnyMachineChangeEvent>
  extends TransitionInternals<Event>,
    StateChangeNotifyInternals<Event> {
  store: StoreInternals<Event>;
  transition?: (event: Event) => Event | undefined;
}

interface StateChangeMachineInternals<
  States extends AnyStatesFactory,
  S extends StateFromFactory<States>,
  Event extends ChangeMachineEvent<any, S, S, any>,
  TC extends TransitionConfig<States>,
> extends ChangeMachineInternals<Event>,
    StateChangeNotifyInternals<Event>,
    StateChangeMachineTransitionContext<TC, States> {
  states: States;
  transitions: TC;
  store: StoreInternals<Event>;
  transition?: (event: Event) => Event | undefined;
}

type X = FlatEventKeys<{
  Ignore1: { a: 1 };
  Ignore2: { b: 2 };
}>; // "a" | "b"
// implement FlatEventKeys
export type FlatEventKeys<T> = {
  [K in keyof T]: keyof T[K];
}[keyof T];

export type StateFromFactory<
  States extends AnyStatesFactory,
  StateKey extends keyof States = keyof States,
> = ReturnType<States[StateKey]>;

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

export type TransitionRecord = Record<
  string,
  Record<string, (...args: any[]) => any>
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

export type AnyStatesFactory = Record<string, (...params: any[]) => State>; 

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

const atom = <T>(initial: T): StoreInternals<T> => {
  let value = initial;
  return {
    get() {
      return value;
    },
    set(newValue: T) {
      value = newValue;
    },
  };
};

const emptyEffect = <E>(event: E) => {};

const defaultInternals = {
  guard: (event: AnyMachineChangeEvent) => true,
  handle: (event: AnyMachineChangeEvent) => event,
  enter: emptyEffect,
  exit: emptyEffect,
};

type ResolveTransition<E extends AnyMachineChangeEvent> = (
  event: ResolveEvent<E>,
) => E | undefined;

function createResolver<
  C extends StateChangeMachineTransitionContext<any, any>,
  E extends MachineContextEvent<C> = MachineContextEvent<C>,
>(context: C): ResolveTransition<E> {
  const { states, transitions } = context;
  return ({ from, type, params, machine }) => {
    const to = transitions[from][type];
    if (!to) return undefined;
    if (typeof to === "function") {
      const targetStateOrFunc = to(...params);
      return typeof targetStateOrFunc === "function"
        ? targetStateOrFunc(from, type, context, machine)
        : targetStateOrFunc;
    } else {
      return states[to as keyof typeof states](...params) as any;
    }
  };
}

export type CreateStateChangeMachineProps<SF extends AnyStatesFactory> =
  Partial<StateChangeMachineInternals<any, any, any, any>>;

export function createStateChangeMachine<
  TC extends TransitionConfig<SF>,
  SF extends AnyStatesFactory,
  Props extends CreateStateChangeMachineProps<SF>,
  E extends MachineContextEvent<StateChangeMachineTransitionContext<TC, SF>>,
>(states: SF, transitions: TC, options?: Props): StateMachine<TC, SF> {
  const internals = {
    ...defaultInternals,
    ...options,
    store: options?.store || atom<E>({} as E),
    resolver: options?.resolve || createResolver({ states, transitions }),
  } as ChangeMachineInternals<E>;
  if (!internals.store) internals.store = atom<E>({} as E);
  const machine = {
    getChange: () => internals.store.get(),
    getState: () => internals.store.get().to,
    send: (type, ...params) => {
      const lastEvent = internals.store.get();
      const nextState = internals.resolve({
        ...lastEvent,
        from: lastEvent.to,
        type,
        machine,
      });
      if (!nextState) return;
      const nextEvent = {
        ...lastEvent,
        type,
        from: lastEvent.to,
        to: nextState,
      };
      if (!internals.guard(nextEvent)) return;
      const handled = internals.handle(nextEvent);
      if (!handled) return;
      internals.store.set(handled);
      internals.exit(handled);
      internals.enter(handled);
    },
    api: {} as any, // stubs,
    senders: {} as any, // stubs
  };
  return machine;
}

type ResolveEvent<E extends MachineContextEvent<any, any[]>> = Omit<E, "to"> & {
  machine: StateMachine<any, any, E>;
};

type StateMachineHooks<E extends AnyMachineChangeEvent> = {
  resolve?: Middleware<ResolveEvent<E>>;
  guard?: Middleware<E>;
  handle?: Middleware<E>;
  enter?: Middleware<E>;
  exit?: Middleware<E>;
};

export function createMachineWithHooks<
  SF extends AnyStatesFactory,
  T extends TransitionConfig<SF>,
  C extends CreateStateChangeMachineProps<any> & {
    hooks?: StateMachineHooks<E>;
  },
  E extends MachineContextEvent<
    StateChangeMachineTransitionContext<T, SF>
  > = MachineContextEvent<StateChangeMachineTransitionContext<T, SF>>,
>(states: SF, transitions: T, options: C) {
  const internals: C & { hooks?: StateMachineHooks<E> } = {
    ...options,
    resolve: (event) => {
      let result: E | undefined = undefined;
      let resolve = options.resolve ?? createResolver({ states, transitions });
      internals.hooks?.resolve?.(
        event,
        (nextEvent) => (result = nextEvent && resolve(nextEvent)),
      );
      return result;
    },
    guard: (event) => {
      let result = true;
      let guard = options.guard ?? defaultInternals.guard;
      internals.hooks?.guard?.(
        event,
        (nextEvent) => (result = !!nextEvent && guard(nextEvent)),
      );
      return result;
    },
    handle: (event) => {
      let result: E | undefined = event;
      let handle = options.handle ?? defaultInternals.handle;
      internals.hooks?.handle?.(
        event,
        (nextEvent) => (result = nextEvent && handle(nextEvent)),
      );
      return result;
    },
    enter: (event) => {
      internals.hooks?.enter?.(event, (nextEvent) =>
        (internals.enter ?? defaultInternals.enter)(nextEvent ?? event),
      );
    },
    exit: (event) => {
      internals.hooks?.exit?.(event, (nextEvent) =>
        (internals.exit ?? defaultInternals.exit)(nextEvent ?? event),
      );
    },
  };
  return createStateChangeMachine(states, transitions, internals);
}
