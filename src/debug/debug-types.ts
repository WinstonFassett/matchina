import { Funcware, AbortableEventHandler, abortableEventware, functionTap, HasMethod, MethodOf, methodExtender, iff, setup, Disposer, disposers, extendMethod } from "../ext";
import { FlatMemberUnion, FlatMemberUnionToIntersection, Func, Members, Simplify, TUnionToIntersection } from "../utility-types";
import { Effect, Middleware } from "../types";
import { EntryListener, ExitListener, when } from '../extras/when'
import { MemberExtensions, matchboxFactory } from "../matchbox";

interface StateMachineEvent<To = any, From = To>  {
  type: string;
  params: any[];
  to: To;
  from: From;
  get machine(): StateMachinery<StateMachineEvent<To,From>>;
}

interface StateMachinery<E extends StateMachineEvent = StateMachineEvent> {
  getState(): E["to"] | E["from"];
  getChange(): E;
  send: (type: E['type'], ...params: E['params']) => void;
  resolve(ev: ResolveEvent<E>): E | undefined;
  transition(change: E): void;
  guard(ev: E): boolean;
  handle(ev: E): E | undefined;
  before(ev: E): E | undefined;
  update(ev: E): void;
  effect(ev: E): void;
  leave(ev: E): void;
  enter(ev: E): void;
  notify(ev: E): void;
  after(ev: E): void;
}

interface FactoryMachineContext<SF extends AnyStatesFactory = AnyStatesFactory> {
  states: SF;
  transitions: FactoryMachineTransitions<SF>;
}

interface FactoryMachine<
    FC extends FactoryMachineContext,    
  > extends StateMachinery<FactoryMachineEvent<FC>> {
    states: FC['states'];
    transitions: FC['transitions'];
  }
  
interface FactoryMachineEvent<FC extends FactoryMachineContext> extends StateMachineEvent {
  type: string & FlatEventKeys<FC['transitions']>;
  params: any[];
  from: AnyFactoryState<FC['states']>;
  to: AnyFactoryState<FC['states']>;
  get machine(): FactoryMachine<FC> & StateMachinery<FactoryMachineEvent<FC>>;
}

type FlatEventKeys<T> = {
  [K in keyof T]: keyof T[K];
}[keyof T];

type AnyFactoryState<
  States extends AnyStatesFactory,
  StateKey extends keyof States = keyof States,
> = ReturnType<States[StateKey]>;

type AnyStatesFactory = Record<string, (...params: any) => any>;

type FactoryMachineTransitions<SF extends AnyStatesFactory> = {
  [FromStateKey in string & keyof SF]: {
    [EventKey in string]?:
      | keyof SF
      | ((...params: any[]) => AnyFactoryState<SF>)
      | ((...params: any[]) => (
          ev: ResolveEvent<FactoryMachineEvent<{ states: SF, transitions: any }>> & {
            from: AnyFactoryState<SF, FromStateKey>;
          },
        ) => AnyFactoryState<SF>);
  };
};

type  TransitionRecord<T = any> = Record<string, Record<string, T>>;

interface TransitionContext {
  transitions: TransitionRecord;
}

export function createStateMachine<E extends StateMachineEvent>(
  transitions: TransitionRecord,
  initialState: E["from"],
) {  
  let lastChange = {
    type: "init",
    to: initialState,
  } as E;
  const machine:  StateMachinery<E> & TransitionContext = {
    transitions,
    getChange: () => lastChange,
    getState: () => lastChange.to,
    send(type, ...params) {
      const lastChange = machine.getChange();
      const resolved = machine.resolve({
        type,
        params,
        from: lastChange.to,
      } as ResolveEvent<E>);
      if (resolved) {
        machine.transition(resolved);
      }
    },
    resolve(ev) {
      const to = machine.transitions[ev.from.key][ev.type];
      if (to) {
        return { ...ev, to } as E;
      }
    },
    guard: (ev: E) => true,
    transition(change: E) {
      if (!machine.guard(change)) {
        return;
      }
      let update = machine.handle(change); // process change
      if (!update) {
        return;
      }
      update = machine.before(update); // prepare update
      if (!update) {
        return;
      }
      machine.update(update); // apply update
      machine.effect(update); // internal effects
      machine.notify(update); // notify consumers
      machine.after(update); // cleanup
    },
    handle: (change: E) => change,
    before: (update: E) => update,
    update: (update: E) => {
      lastChange = update;
    },
    effect(ev: E) {
      machine.leave(ev); // left previous
      machine.enter(ev); // entered next
    },
    leave(ev: E) {
      console.log("left", ev.from.key);
    },
    enter(ev: E) {
      console.log("entered", ev.to.key);
    },
    notify(ev: E) {},
    after(ev: E) {},
  };
  return machine;
}

export function createFactoryMachine<
  FC extends FactoryMachineContext,
  E extends FactoryMachineEvent<FC> = FactoryMachineEvent<FC>,
>(
  states: FC['states'],
  transitions: FC['transitions'],
  init: KeysWithZeroArgs<FC['states']> | AnyFactoryState<FC['states']>,
): FactoryMachine<FC> {
  const initialState = (
    typeof init === "string" ? states[init]({}) : init
  ) as AnyFactoryState<FC['states']>;
  const machine = createStateMachine<E>(transitions, initialState);
  Object.assign(machine, {
    states,
    resolve: (ev: ResolveEvent<E>): E | undefined => {
      const to = nextFactoryState<FC>(transitions, states, ev);
      if (to) {
        return { ...ev, to } as E;
      }
    },
  });
  return machine as any;
}

export function nextFactoryState<
  FC extends FactoryMachineContext
>(transitions: FC['transitions'], states: FC['states'], ev: ResolveEvent<FactoryMachineEvent<FC>>) {
  const to = transitions[ev.from.key][ev.type];
  if (!to) {
    return undefined;
  }
  if (typeof to === "function") {
    const stateOrFn = to(...ev.params);
    return typeof stateOrFn === "function" ? (stateOrFn as any)(ev) : stateOrFn;
  } else {
    return states[to as keyof typeof states](...ev.params) as any;
  }
}

type KeysWithZeroArgs<T> = {
  [K in keyof T]: FunctionWithParameters<T[K]> extends true ? never : K;
}[keyof T];

type FunctionWithParameters<F> = F extends (...args: infer Args) => any
  ? Args extends []
    ? false
    : true
  : false;

type ResolveEvent<C> = Omit<C, 'to'>;

export type FactoryMachineState<Tag extends string & keyof Specs, Specs> = {
  key: Tag;
  data: StateData<Specs[Tag]>;
} & MemberExtensions<Specs, "key">;

export type States<Specs extends UnionSpec> = {
  [T in string & keyof Specs]: CreateState<Specs, T>;
};

export type UnionSpec<Val = any> = {
  [k: string]: Val;
} & { _?: never };


type CreateState<Specs, Tag extends string & keyof Specs> = Specs[Tag] extends (
  ...args: infer P
) => infer R
  ? (...args: P) => FactoryMachineState<Tag, Specs>
  : () => FactoryMachineState<Tag, Specs>;

type StateData<Spec> = Spec extends (...args: any[]) => any
  ? ReturnType<Spec>
  : Spec;

type PromiseStates<F extends PromiseCallback, E = Error> = States<{
  Idle: undefined;
  Pending: (...params: Parameters<F>) => Parameters<F>;
  Rejected: (error: E) => E;
  Resolved: (data: Awaited<ReturnType<F>>) => Awaited<ReturnType<F>>;
}>;

const PromiseTransitions = {
  Idle: { execute: "Pending" },
  Pending: {
    resolve: "Resolved",
    reject: "Rejected",
  },
  Resolved: {},
  Rejected: {},
} as const;

type PromiseCallback = (...args: any[]) => Promise<any>;

const slowlyAddTwoNumbers = (
  x: number,
  y: number,
  duration = 1000,
  name = "unnamed",
) =>
  new Promise<number>((resolve) => setTimeout(() => resolve(x + y), duration));



const m : FactoryMachine<{
  states: PromiseStates<typeof slowlyAddTwoNumbers>,
  transitions: typeof PromiseTransitions
}> = {} as any;

function machineRelatedFunction(m: FactoryMachine<any>) {
  console.log('ok')
}

machineRelatedFunction(m)

const mapi = withApi(m);
mapi.api.reject(new Error('nope'))

export function createApi<
 M extends FactoryMachine<any>
>(machine: M): FactoryMachineApi<M> {
  const { states, transitions } = machine;
  const createSender =
    (eventKey: any) =>
    (...params: any[]) => {
      return machine.send(eventKey, ...(params as any));
    };

  const transitioners: any = {};
  const events: any = {};
  for (const stateKey in states) {
    const transitionKey = stateKey as keyof typeof transitions;
    const stateTransitions = transitions[transitionKey];
    transitioners[transitionKey] = {};
    if (stateTransitions) {
      for (const eventKey in stateTransitions) {
        const sender = createSender(eventKey);
        transitioners[transitionKey][eventKey] = sender;
        events[eventKey] ||= sender;
      }
    }
  }
  return events;
}

type FactoryMachineApi<
  FC extends FactoryMachineContext,
> = Simplify<object & FlatEventSenders<FC>>;

type WithApi<
  FC extends FactoryMachineContext
> = FC & {
  api: FactoryMachineApi<FC>;
};

export function withApi<M extends FactoryMachine<any>>(target: M) {
  const enhanced = target as WithApi<M>;
  if (enhanced.api) {
    return enhanced;
  }
  return Object.assign(target, {
    api: createApi<M>(enhanced),
  }) as WithApi<M>;
}

export type FlatEventSenders<
  FC extends FactoryMachineContext,
> = FlatMemberUnionToIntersection<
  StateEventTransitionSenders<FC>
>;

export type StateEventTransitionSenders<
  FC extends FactoryMachineContext
> = {
  [StateKey in keyof StateEventTransitionFuncs<FC>]: {
    [EventKey in keyof StateEventTransitionFuncs<FC>[StateKey]]: (
      ...args: Parameters<
        StateEventTransitionFuncs<FC>[StateKey][EventKey]
      >
    ) => void;
  };
};

export type StateEventTransitionFuncs<
  FC extends FactoryMachineContext
> = {
  [TransitionStateKey in keyof FC['transitions']]: StateEventTransitionFunc<
    FC,
    TransitionStateKey
  >;
};

export type StateEventTransitionFunc<
  FC extends FactoryMachineContext,
  TransitionStateKey extends keyof FC['transitions'],
  Transitions extends FC['transitions'] = FC['transitions'],
  States extends FC['states'] = FC['states'],
> = {
  [EventKey in keyof Transitions[TransitionStateKey] &
    string]: Transitions[TransitionStateKey][EventKey] extends keyof States
    ? // if state key
      (
        ...args: Parameters<States[Transitions[TransitionStateKey][EventKey]]>
      ) => AnyFactoryState<States, Transitions[TransitionStateKey][EventKey]>
    : Transitions[TransitionStateKey][EventKey] extends (
        ...args: infer A
      ) => (...innerArgs: any[]) => infer R
    ? // if 2-stage function
      (...args: A) => R
    : // if 1-stage function
    Transitions[TransitionStateKey][EventKey] extends (
        ...args: any[]
      ) => AnyFactoryState<States>
    ? (
        ...args: Parameters<Transitions[TransitionStateKey][EventKey]>
      ) => AnyFactoryState<States> & {
        key: Transitions[TransitionStateKey][EventKey];
      }
    : never;
};


// HOOKS:


//#region Adapters
export type Adapters<E extends StateMachineEvent = StateMachineEvent> = {
  [key: string]: Func;
} & {
  transition: (middleware: Middleware<E>) => Funcware<StateMachinery<E>["transition"]>;
  update: (middleware: Middleware<E>) => Funcware<StateMachinery<E>["update"]>;
  resolve: <F extends StateMachinery<E>["resolve"]>(resolveFn: F) => Funcware<F>;
  guard: (guardFn: StateMachinery<E>['guard']) => Funcware<StateMachinery<E>['guard']>;
  handle: (handleFn: StateMachinery<E>['handle']) => Funcware<StateMachinery<E>['handle']>;
  before: (abortware: AbortableEventHandler<E>) => Funcware<Transform<E>>;
  leave: Transform<Effect<E>, Funcware<Effect<E>>>;
  after: Transform<Effect<E>, Funcware<Effect<E>>>;
  enter: Transform<Effect<E>, Funcware<Effect<E>>>;
  effect: Transform<Effect<E>, Funcware<Effect<E>>>;
  notify: Transform<Effect<E>, Funcware<Effect<E>>>;
};
type Transform<I, O = I> = (source: I) => O;

export const HookAdapters = {
  transition: (middleware) => (next) => (ev) => { middleware(ev, next); },
  update: (middleware) => (next) => (ev) => { middleware(ev, next); },
  resolve: (resolveFn) => (next) => (ev) => resolveFn(ev) ?? next(ev),
  guard: (guardFn) => (inner) => combineGuards(inner, guardFn),
  handle: (handleFn) => (inner) => composeHandlers(handleFn, inner),
  before: (abortware) => abortableEventware(abortware),
  leave: functionTap,
  after: functionTap,
  enter: functionTap,
  effect: functionTap,
  notify: functionTap,
} as Adapters;
//#endregion

// #region Interceptors
// export const send = methodHook("send");
export const before = hookSetup("before");
export const transition = hookSetup("transition");
export const resolve = hookSetup("resolve");
export const guard = hookSetup('guard')
export const update = hookSetup("update");
export const handle = hookSetup("handle");
//#endregion

// #region Effects
export const effect = hookSetup("effect");
export const leave = hookSetup('leave')
export const enter = hookSetup("enter");
export const after = hookSetup("after");
export const notify = hookSetup("notify");
//#endregion

export const onBefore = machineHook("before");
export const onTransition = machineHook("transition");
export const onResolve = machineHook("resolve");
export const onGuard = machineHook("guard");
export const onUpdate = machineHook("update");
export const onHandle = machineHook("handle");
export const onEffect = machineHook("effect");
export const onLeave = machineHook("leave");
export const onEnter = machineHook("enter");
export const onAfter = machineHook("after");
export const onNotify = machineHook("notify");

function machineHook<K extends string & keyof Adapters>(key: K) {
  return <T extends HasMethod<K>>(
    machine: T,
    fn: MethodOf<T,K>
  ) => methodExtender<K>(key)
    (HookAdapters[key](fn))(machine)  
}

function hookSetup<K extends string & keyof Adapters>(key: K) {
  return <T extends HasMethod<K>>(
    ...config: Parameters<Adapters<Parameters<MethodOf<T, K>>[0]>[K]>
  ) =>
    methodExtender<K>(key)(HookAdapters[key](...config)) as (
      target: T,
    ) => () => void;
}

function composeHandlers<E extends StateMachineEvent>(
  outer: (value: E) => E | undefined,
  inner: (value: E) => E | undefined,
): (value: E) => E | undefined {
  return (ev) => outer(inner(ev) as any);
}

function combineGuards<E extends StateMachineEvent>(
  first: (value: E) => boolean,
  next: (value: E) => boolean,
): (value: E) => boolean {
  return (ev) => {
    const res = first(ev) && next(ev);
    return res;
  };
}

// TYPEGUARDS

export type AnyKeyedChangeEvent = {
  type: string
  to: { key: string }
  from: { key: string }  
}

export type KeyedChangeEvent<Type extends string, ToKey extends string, FromKey extends string> = {
  type: Type
  to: { key: ToKey }
  from: { key: FromKey }  
}

export function hasKeyValue<T, K extends PropertyKey, V>(
  obj: T,
  key: K,
  values: V | V[],
): obj is T & Record<K, V> {
  if (!Array.isArray(values)) {
    return (obj as Record<K, V>)[key] === values;
  }
  return values.includes((obj as Record<K, V>)[key]);
}

function matchKey<T>(keyOrKeys: T | T[] | undefined, value: T) {
  if (keyOrKeys === undefined) {
    return true;
  }
  return Array.isArray(keyOrKeys)
    ? keyOrKeys.includes(value)
    : keyOrKeys === value;
}

export type KeyedChangeEventFilter<E extends AnyKeyedChangeEvent> = Filters<{
  type: E['type'],
  to: E['to']['key'],
  from: E['from']['key']
}>

export function isKeyedChangeEvent<
  E extends AnyKeyedChangeEvent
>(
  filter: KeyedChangeEventFilter<E>,
  event: E,
): event is E & AnyKeyedChangeEvent {
  const subject = event as any;
  const matched =
    matchKey(filter.to, subject?.to?.key) &&
    matchKey(filter.type, subject?.type) &&
    matchKey(filter.from, subject?.from?.key);
  // console.log('match?', matched, filter, event.type)
  return matched;
}
export function isChangeTypeToFrom<
  E,
  Type extends string,
  ToKey extends string,
  FromKey extends string,
>(
  event: E,
  type?: Type | Type[],
  to?: ToKey | ToKey[],
  from?: FromKey | FromKey[],
): event is E & KeyedChangeEvent<Type, FromKey, ToKey> {
  const subject = event as any;
  return (
    matchKey(to, subject?.to?.key) &&
    matchKey(type, subject?.type) &&
    matchKey(from, subject?.from?.key)
  );
}
export function asChangeTypeToFrom<
  E,
  Type extends string,
  ToKey extends string,
  FromKey extends string,
>(
  event: E,
  type?: Type | Type[],
  to?: ToKey | ToKey[],
  from?: FromKey | FromKey[],
): E & KeyedChangeEvent<Type, FromKey, ToKey> {
  if (isChangeTypeToFrom(event, type, to, from)) {
    return event;
  }
  throw new Error("not a match");
}

type Filters<T> = object & {
  [K in keyof T]?: T[K] | T[K][];
};

export type TransitionHookExtensions<E extends StateMachineEvent> = {
  begin: AbortableEventHandler<E>;
  resolve: Funcware<(ev: Partial<E>) => E>;
  transition: AbortableEventHandler<E>;
  guard: StateMachinery<E>['guard'];
  handle: StateMachinery<E>['handle'];
  before: AbortableEventHandler<E>;
  effect: Effect<E>;
  leave: Effect<E>;
  enter: Effect<E>;
  notify: Effect<E>;
  after: Effect<E>;
  end: Effect<E>;
};

const leftState = <E extends FactoryMachineEvent<any>, K extends keyof E['machine']['states']>(stateKey: K, fn: EntryListener<{ from: AnyFactoryState<E['machine']['states'],K> }>) => when<E>(ev => ev.from.key === stateKey, fn)
const enteredState = <E extends FactoryMachineEvent<any>, K extends keyof E['machine']['states']>(stateKey: K, fn: EntryListener<{ to: AnyFactoryState<E['machine']['states'],K> }>) => when<E>(ev => ev.from.key === stateKey, fn)


onNotify(m, leftState('Idle', (ev) => {  
  ev.from.key = 'Idle'
}))

setup(m)(
  notify(leftState('Idle', ev => {
    ev.from.key = 'Idle'
  })),
  notify(enteredState('Pending', ev => {
    ev.to.key = 'Pending'
  }))
)

const onLeftState = <E extends FactoryMachineEvent<any>, K extends keyof E['machine']['states']>(
  m: StateMachinery<E>,
  stateKey: K, fn: ExitListener<{ from: AnyFactoryState<E['machine']['states'],K> }>) => setup(m)(
  leave(leftState(stateKey, fn))
)

onLeftState(m, 'Rejected', ev => {
  ev.from.key = 'Rejected'
})

const beforeEvent = <E extends FactoryMachineEvent<any>, K extends E['type']>(
  type: K,
  fn: AbortableEventHandler<E & { type: K }>,
) => before<StateMachinery<E>>(
  (ev, abort) => {
    if (ev.type === type) {
      fn(ev as any, abort);
    }
  }
)

const afterEvent = <E extends FactoryMachineEvent<any>, K extends E['type']>(
  type: K,
  fn: Effect<E & { type: K }>,
) => after<StateMachinery<E>>(
  (ev) => {
    if (ev.type === type) {
      fn(ev as any);
    }
  }
)

setup(m)(
  beforeEvent('reject', (ev, abort) => {
    ev.type = 'reject'
  }),
  afterEvent('reject', ev => {
    ev.type = 'reject'    
  })
)
const onBeforeEvent = <E extends FactoryMachineEvent<any>, K extends E['type']>(
  m: StateMachinery<E>,
  type: E['type'],
  fn: AbortableEventHandler<E & { type: E["type"]; }>,
) => setup(m)(
  beforeEvent(type, fn)
)


onBeforeEvent(m, 'reject', (ev, abort) => {
  ev.type = 'reject'  
  abort()
})

const onAfterEvent = <E extends FactoryMachineEvent<any>, K extends E['type']>(
  m: StateMachinery<E>,
  type: K,
  fn: Effect<E & { type: K; }>,
) => setup(m)(
  afterEvent<E,K>(type, fn)
)

onAfterEvent(m, 'execute', ev => {
  ev.type = 'execute'
})

// primitive theoretical types. do not use lol

// interface Change<T> {
//   from: T;
//   to: T;
// }

// interface ChangeEvent<
//   Type extends string = string,
//   To = any,
//   From = any,
// > {
//   type: Type;
//   to: To;
//   from: From;
// }

// interface CommandEvent<T, P extends any[]> {
//   type: T;
//   params: P;
// }

// type ChangeCommandEvent<
//   Type extends string = string,
//   Params extends any[] = any[],
//   To = any,
//   From = To,
// > = ChangeEvent<Type, To, From> & CommandEvent<Type, Params>;


// interface ChangeMachine<E extends Change<any>> {
//   getState(): E["to"] | E["from"];
//   getChange(): E;
//   update(change: E): void;
// }

// interface SimpleMachineContext<T> {  
//   transitions: TransitionRecord<T>;
// }

export type TransitionHookConfig<E extends StateMachineEvent<any, any>> = Filters<TransitionHookExtensions<E>>;

export type StateTransitionHooks<
  FC extends FactoryMachineContext,  
  StateKey extends keyof FC['transitions'] | "*",
> = {
  leave: Middleware<
    FactoryMachineEvent<FC> & {
      from: AnyFactoryState<
        FC['states'],
        StateKey extends keyof FC['states'] ? StateKey : keyof FC['states']
      >;
    }
  >;
  enter: Middleware<
    FactoryMachineEvent<FC> & {
      to: AnyFactoryState<
        FC['states'],
        StateKey extends keyof FC['states'] ? StateKey : keyof FC['states']
      >;
    }
  >;
};

export type StateTransitionHookConfig<
  FC extends FactoryMachineContext,
  StateKey extends keyof FC['transitions'] | "*",
> = Filters<StateTransitionHooks<FC, StateKey>>;

type On<
  FC extends FactoryMachineContext,
  StateKey extends keyof FC['transitions'] | "*",
  Transitions extends FC['transitions'] = FC['transitions'],
  States extends FC['states'] = FC['states'],
> =
  // regular state
  StateKey extends keyof States
    ? // specific state
      {
        [Event in
          | keyof Transitions[StateKey]
          | "*"]?: Event extends FlatFactoryEventKeys<FC> // specific event
          ? ReturnType<
              StateEventTransitionFuncs<FC>[StateKey][Event]
            > extends AnyFactoryState<States>
            ? TransitionHookConfig<
                FactoryMachineEvent<FC> & {
                  type: Event;
                  from: AnyFactoryState<
                    States,
                    StateKey extends keyof States ? StateKey : keyof States
                  >;
                  to: ReturnType<
                    StateEventTransitionFuncs<
                      FC
                    >[StateKey][Event]
                  >;
                  params: Parameters<
                    StateEventTransitionFuncs<
                      FC
                    >[StateKey][Event]
                  >;
                }
              >
            : never
          : // wildcard event
            TransitionHookConfig<
              FactoryMachineEvent<FC> & {
                from: AnyFactoryState<
                  States,
                  StateKey extends keyof States ? StateKey : keyof States
                >;
              }
            >;
      }
    : // wildcard state
      {
        [AnyStateEvent in
          | FlatFactoryEventKeys<FC>
          | "*"]?: TransitionHookConfig<
          FactoryMachineEvent<FC> & {
            type: AnyStateEvent extends "*"
              ? FlatFactoryEventKeys<FC>
              : AnyStateEvent;
            from: AnyFactoryState<
              States,
              StateKey extends keyof States ? StateKey : keyof States
            >;
            to: ReturnType<
              StateEventTransitionFuncs<
                FC
              >[StateKey][AnyStateEvent]
            >;
            params: Parameters<
              StateEventTransitionFuncs<
                FC
              >[StateKey][AnyStateEvent]
            >;
          }
        >;
      };

export type FlatExitStates<
  FC extends FactoryMachineContext,
  States extends FC['states'] = FC['states']
> = Members<{
  [StateKey in keyof StateEventTransitionFuncs<FC>]: {
    [EventKey in keyof StateEventTransitionFuncs<
      FC
    >[StateKey]]: StateEventTransitionFuncs<
      FC
    >[StateKey][EventKey] extends (...args: any[]) => infer TargetState
      ? TargetState extends AnyFactoryState<States, infer TargetStateKey>
        ? TargetStateKey extends keyof States
          ? TargetState
          : never
        : never
      : never;
  }[keyof StateEventTransitionFuncs<FC>[StateKey]];
}>;

export type EventExitStatesIntersection<
FC extends FactoryMachineContext,
> = TUnionToIntersection<
  FlatMemberUnion<StatesToEventsToStates<FC>>
>;

export type StatesToEventsToStates<
  FC extends FactoryMachineContext,
> = {
  [StateKey in keyof StateEventTransitionFuncs<FC>]: {
    [EventKey in keyof StateEventTransitionFuncs<FC>[StateKey]]: ReturnType<
      StateEventTransitionFuncs<FC>[StateKey][EventKey]
    >;
  };
};

export type StateEventHookConfig<
FC extends FactoryMachineContext,
> = {
  [StateKey in string & (keyof FC['transitions'] | "*")]?: {
    on?: On<FC, StateKey>;
  } & StateTransitionHookConfig<FC, StateKey>;
};

export type FlatFactoryEventKeys<
  FC extends FactoryMachineContext,
> = string &
  {
    [StateKey in keyof StateEventTransitionFuncs<
      FC
    >]: keyof StateEventTransitionFuncs<FC>[StateKey];
  }[keyof StateEventTransitionFuncs<FC>];


export function onLifecycle<
FC extends FactoryMachineContext,
>(
machine: FactoryMachine<FC>,
config: StateEventHookConfig<FC>,
) {
const d = [] as Disposer[];
for (const key in config) {
  const stateKey = key === "*" ? undefined : key;
  const fromStateConfig = config[key as keyof typeof config];
  if (!fromStateConfig) {
    continue;
  }
  const { on, enter , leave } = fromStateConfig;
  if (enter) {
    useFilteredEventConfigs(machine, { to: stateKey }, { enter } as any, d);
  }
  if (leave) {
    useFilteredEventConfigs(machine, { from: stateKey }, { leave } as any, d);
  }
  if (on) {
    for (const onKey in on) {
      const eventKey = onKey === "*" ? undefined : onKey;
      const eventConfig = on[onKey as keyof typeof on];
      if (!eventConfig) {
        continue;
      }
      useFilteredEventConfigs(
        machine,
        { from: stateKey, type: eventKey },
        eventConfig as StateEventHookConfig<FC>,
        d,
      );
    }
  }
}
return disposers(d);
}

function useFilteredEventConfigs<
  FC extends FactoryMachineContext,
>(
machine: FactoryMachine<FC>,
filter: KeyedChangeEventFilter<FactoryMachineEvent<FC>>,
config:
  | StateEventHookConfig<FC>
  | TransitionHookConfig<FactoryMachineEvent<FC>>,
d: Disposer[],
) {
for (const phase in config) {
  const hook = config[phase as keyof typeof config];
  if (hook) {
    const hookHandler = (HookAdapters as typeof HookAdapters)[phase as keyof typeof HookAdapters];
    console.log("add hook", phase, filter);
    d.push(
      extendMethod(
        machine,
        phase as keyof FactoryMachine<FC>,
        iff(
          (ev: FactoryMachineEvent<FC>) => isKeyedChangeEvent(filter, ev),
          (hookHandler as any)?.(hook, machine) ?? hook,
        ) as any,
      ),
    );
  }
}
return d;
}


onLifecycle(m, {
  Idle: {
    on: {
       execute: {
        guard: ev => ev.type === 'execute'
       }
    }
  }
})

const onGuardEvent = <E extends FactoryMachineEvent<any>, K extends E['type']>(
  m: StateMachinery<E>,
  type: K,
  fn: StateMachinery<E & { type: K }>['guard'],
) => setup(m)(
  guard((ev) => {
    if (ev.type === type) {
      return fn(ev as any)
    }
    return true
  })
)

onGuardEvent(m, 'execute', ev => ev.type === 'execute')

// setup(m)(
//   guard(ev => )
// )

function defineStates<Config extends UnionSpec>(config: Config) {
  return matchboxFactory(config, "key") as States<Config>;
}