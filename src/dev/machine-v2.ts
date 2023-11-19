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
export type AnyMachineChangeEvent = ChangeMachineEvent<any, any, any, any>;

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

export interface MinimalMachineContext<
  SF extends AnyStatesFactory,
  I extends StateFromFactory<SF>, 
  TC extends TransitionConfig<SF>, 
> {
  states: SF;
  initialState: I;
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
    // StateFromFactory<Context["states"]>,
    FlatExitStates<Context['transitions'], Context['states']>,
    // StateFromFactory<Context["states"]>,
    FlatEntryStates<Context['transitions'], Context['states']>,
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

export interface StateChangeMachineInternals<
  TC extends TransitionConfig<States>,
  States extends AnyStatesFactory,
  Event extends ChangeMachineEvent<any, StateFromFactory<States>, StateFromFactory<States>, any> = ChangeMachineEvent<any, StateFromFactory<States>, StateFromFactory<States>, any>,
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


export type FilterEmptyRecordKeys<T> = {
  [K in keyof T]: keyof T[K] extends never ? never : K;
}[keyof T];

// type KeysWithTransitions<T> = FilteredKeys<T>;

export type FlatEntryStates<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
  BaseState extends StateFromFactory<States> = StateFromFactory<States>
> = {
  // [TransitionKey in FilterEmptyRecordKeys<Transitions>]: TransitionKey extends keyof States ? ReturnType<States[TransitionKey]> & BaseState: never;
  [K in keyof Transitions]: 
    keyof Transitions[K] extends never 
      ? never 
      : K extends keyof States ? ReturnType<States[K]> : never;
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
  // console.log('createResolver', context)
  const { states, transitions } = context;
  return ({ from, type, params, machine }) => {
    console.log('resolve', {from, type, params, machine})
    const to = transitions[from.key][type];
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
  Partial<StateChangeMachineInternals<any, any, any>>;


// hmm I think I need something like middleware for initing internals
// maybe an init middleare hook instead of passing in internals. yes. 
type Effect<E> = (event: E) => void

export function createStateChangeMachine<
  TC extends TransitionConfig<SF>,
  SF extends AnyStatesFactory,
  Props extends CreateStateChangeMachineProps<SF>, 
  E extends MachineContextEvent<StateChangeMachineTransitionContext<TC, SF>>,
>(
  states: SF,
  initialState: StateFromFactory<SF>,
  transitions: TC,
  init?: Middleware<CreateStateChangeMachineProps<SF>>,
): StateMachine<TC, SF> {
  const ensureKernel = (props: Props): StateChangeMachineInternals<TC, SF, E> => {
    // console.log('ensureKernel', props)
    return Object.assign(props, {
      ...defaultInternals,    
      states,
      transitions,
      store: props.store ?? atom<E>({} as E),
      resolve: props.resolve ?? createResolver({ states, transitions }),
    })
  }
  let kernelInit = {  } as Props;
  let kernel: StateChangeMachineInternals<TC, SF, E> = kernelInit as any;
  if (init) {
    console.log('INIT', init)
    init(kernelInit, (enhanced) => {  
      console.log({ enhanced })
      if (enhanced && enhanced !== kernelInit) {
        kernelInit = enhanced as Props;
        console.log("something replaced the internals");
      }
    });
    ensureKernel(kernelInit);
  } else {
    ensureKernel(kernelInit);
  }
  const internals = kernel; // as ChangeMachineInternals<E>;
  if (!internals.store) internals.store = atom<E>({} as E);
  internals.store.set({
    type: "__init",
    from: undefined,
    to: initialState,
    params: [] as any[],
  } as E);
  const machine = {
    getChange: () => internals.store.get(),
    getState: () => internals.store.get().to,
    send: (type, ...params) => {
      console.log('send', { type, params })
      const lastEvent = internals.store.get();
      const nextState = internals.resolve({
        ...lastEvent,
        from: lastEvent.to,
        type,
        params,
        machine,
      });
      if (!nextState) return;
      const nextEvent = {
        ...lastEvent,
        type,
        from: lastEvent.to,
        to: nextState,
        params
      };
      if (!internals.guard(nextEvent)) return;
      const handled = internals.handle(nextEvent);
      if (!handled) return;
      internals.store.set(handled);
      console.log('running effects')
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

export function internalsToHooks<
  States extends AnyStatesFactory,
  S extends StateFromFactory<States>,
  Event extends ChangeMachineEvent<any, S, S, any>,
  TC extends TransitionConfig<States>
>(
  internals: StateChangeMachineInternals<TC, States, Event>,
): StateMachineHooks<Event> {
  return {
    resolve: (event, next) => { next(internals.resolve(event) as any) },      
    guard: (event, next) => { if (internals.guard(event)) next(event) },
    handle: (event, next) => { next(internals.handle(event)) },
    exit: (event, next) => { internals.exit(event); next() },
    enter: (event, next) => { internals.enter(event); next() },    
  };
}

export type MachineWithHooks<
  States extends AnyStatesFactory,
  S extends StateFromFactory<States>,
  Event extends StateTransitionEvent<TC, States>, //ChangeMachineEvent<any, S, S, any>,
  TC extends TransitionConfig<States>,
> = StateMachine<TC, States, Event> & {
  hooks: StateMachineHooks<Event>;
};

export type MachineInternalsWithHooks<
  States extends AnyStatesFactory,
  S extends StateFromFactory<States>,
  Event extends ChangeMachineEvent<any, S, S, any>,
  TC extends TransitionConfig<States>,
> = StateChangeMachineInternals<TC, States, Event> & {
  hooks: StateMachineHooks<Event>;
};

export function createMachineWithHooks<
  SF extends AnyStatesFactory,
  T extends TransitionConfig<SF>,
  PI extends CreateStateChangeMachineProps<any> & {
    hooks: StateMachineHooks<E>;
  },
  E extends MachineContextEvent<
    StateChangeMachineTransitionContext<T, SF>
  > = MachineContextEvent<StateChangeMachineTransitionContext<T, SF>>,
>(states: SF, initialState: StateFromFactory<SF>, transitions: T, options: PI) {
  // compose internals
  const { hooks, ...partialInternals } = options;
  const internals: PI = {
    ...options,
    
    // minimal machine context
    states,
    transitions,
    initialState,

  };
  return createStateChangeMachine(
    states,
    initialState,
    transitions,
    (props, next) => {
      ensureHookInternals(props, hooks);
      next(props) // could replace or not call next at all
      console.log('after init internals should be complete')
      const internals = props as MachineInternalsWithHooks<SF, StateFromFactory<SF>, E, T>;
      // could provide store or resolve here before constructor invoked
    },
  );
}

type HasHooks<E extends AnyMachineChangeEvent> = {
  hooks: StateMachineHooks<E>;
}

export function withHooks<
  Options extends CreateStateChangeMachineProps<any>,
  E extends AnyMachineChangeEvent,
>(  
  options: Options & Partial<HasHooks<E>>,
  hooks: StateMachineHooks<E>
) {

  // check if hooks present
  ensureHookInternals(options)
  if (options.hooks) { 
    console.log('Extending hooks')   
    return extendHooks(options.hooks, hooks)
  } 
  // first time to add hooks to this context
  else {
    console.log('adding hooks registry')
    options.hooks = hooks
    return () => {
      delete options.hooks
    }  
  }
}

export function extendHooks<E extends AnyMachineChangeEvent>(
  innerHooks: StateMachineHooks<E>, 
  newHooks: StateMachineHooks<E>) {
    // return Object.assign(innerHooks, newHooks)
    const originals = {} as StateMachineHooks<E>;
    for (const key in newHooks) {
      const hook = newHooks[key];
      const original = innerHooks[key];
      if (original) {
        innerHooks[key] = (event, next) => {
          original(event, (nextEvent) => {
            hook(nextEvent ?? event, next);
          });
        }
        originals[key] = original;
      } else {
        innerHooks[key] = hook
      }
    }
    return () => {
      for (const key in originals) {
        innerHooks[key] = originals[key];
      }
    }
}

// export function extendInternals<I extends ChangeMachineInternals<any>>(
//   baseInternals: I, 
//   extensions: Partial<I>) {
//     // return Object.assign(innerHooks, newHooks)
//     const originals = {} as I;
//     for (const key in extensions) {
//       const hook = extensions[key];
//       const original = baseInternals[key];
//       if (original) {
//         baseInternals[key] = (event, next) => {
//           original(event, (nextEvent) => {
//             hook(nextEvent ?? event, next);
//           });
//         }
//         originals[key] = original;
//       } else {
//         baseInternals[key] = hook
//       }
//     }
//     return () => {
//       for (const key in originals) {
//         baseInternals[key] = originals[key];
//       }
//     }
// }


const HooksMarker = Symbol('HooksMarker')

/**
 * Adapts internals to support hook arrays
 * Registered on internals at hooks.internals
 * This should only be needed once per internals
 * @param baseInternals 
 * @param hooks 
 * @returns 
 */
export function ensureHookInternals<
  Options extends CreateStateChangeMachineProps<any>,
  E extends AnyMachineChangeEvent,
>(
  baseInternals = {} as Options, hooks: StateMachineHooks<E>={}) {
  if (baseInternals[HooksMarker]) return
  const originals = {...baseInternals}
    
  const internals = Object.assign(baseInternals, {
    [HooksMarker]: true,
    hooks,
    // resolve: undefined as any,
    guard: (event) => {
      const innerGuard = (originals.guard ?? defaultInternals.guard)
      if (hooks.guard) {
        let guardResult = false;
        let guardRan = false
        hooks.guard(event, (nextEvent) => {
          if (nextEvent) {
            guardResult = innerGuard(nextEvent ?? event);
            console.log('guard ran', guardResult)
            guardRan = true
          } else {
            console.log('guard skipped')
          }
        });
        if (!guardRan) {
          console.log('guard was short-circuited')
        }
        if (!guardResult) return false;
        console.log('GUARD PASSED')
        return true
      } else {
        console.log('guard without hook')
        return innerGuard(event)
      }
    },
    handle: (event) => {
      let result: E | undefined = event;
      let handle = baseInternals.handle ?? defaultInternals.handle;
      internals.hooks?.handle?.(
        event,
        (nextEvent) => (result = nextEvent && handle(nextEvent)),
      );
      return result;
    },
    enter: (event) => {
      const key = 'enter'
      runWithHooksMaybe<Options, E>(internals, key, event, originals);
    },
    exit: (event) => {
      runWithHooksMaybe<Options, E>(internals, 'exit', event, originals);
      // internals.hooks?.exit?.(event, (nextEvent) =>
      //   (internals.exit ?? defaultInternals.exit)(nextEvent ?? event),
      // );
    },
  })


  internals.resolve ??= createResolver(internals as any);  

  return internals;
}



function runWithHooksMaybe2(hook: any, event: any, original: ((event: any) => boolean) | undefined) {
  if (hook) {
    hook(event, original);
  }
  else {
    original?.(event);
  }
}

function runWithHooksMaybe<
  Options extends CreateStateChangeMachineProps<any>,
  E extends AnyMachineChangeEvent
>(
    internals: Options, 
    key: string, 
    event: any, 
    originals: Options
  ) {
  const hook = (internals as any).hooks?.[key];
  if (hook) {
    hook(event, (nextEvent) => {
      originals[key]?.(event);
    });
  }
  else {
    originals[key]?.(event);
  }
}

