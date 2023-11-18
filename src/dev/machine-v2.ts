import { Middleware } from '../extras/middleware'
interface StateMachine<E extends AnyMachineChangeEvent> {
  getState(): E['to'] | E['from']
  getChange(): E
  send(type: E['type'], ...params: E['params']): void
}

// type StatesRecord<K extends string, S extends State> = Record<K, S>

type TransitionConfig<
  S,
  SR extends Record<string, S>,
  SK extends string & keyof SR = string & keyof SR,
  CP extends any[] = any[],
> = {
  [FromStateKey in string]: {
    [EventKey in string]:
      | SK
      | ((...params: any[]) => S)
      | ((...params: any[]) => (...context: CP) => S);
  };
};

type ConfiguredTransitions<
  Config,  
  SR
> = {
  [S in keyof Config]: {
    [E in keyof Config[S]]: 
      
      // state key
      Config[S][E] extends keyof SR 
      ? SR[Config[S][E]]
      
      // func that returns a state
      : Config[S][E] extends (...params: any[]) => (...params: any[]) => any 
      ?  ReturnType<ReturnType<Config[S][E]>> 
      
      // func that returns a func that takes context params and returns a state
      : Config[S][E] extends (...params: any[]) => any 
      ? ReturnType<Config[S][E]> 

      : never
  }
}

interface State<K extends string = string, D = any> {
  key: K
  data: D
}

interface ChangeEvent<Type, To, From> {
  type: Type
  to: To
  from: From
}

interface ChangeMachineEvent<Type, To, From, Params>

extends ChangeEvent<Type, To, From>
{
  params: Params
}
type AnyMachineChangeEvent = ChangeMachineEvent<any, any, any, any>

interface StateChangeMachineEvent<
  Type extends string,
  To extends State,
  From extends State,
  Params> extends ChangeMachineEvent<Type, To, From, Params> {}


interface StoreInternals<T> {
  get(): T
  set(value: T): void
}

interface TransitionInternals<E> {
  match: (event: Omit<E, 'to'>) => E | undefined,
  guard: (event: E) => boolean,
  handle: (event: E) => E | undefined 
}

interface StateChangeNotifyInternals<E> {
  enter: (event: E) => void
  exit: (event: E) => void
}

type StateRecordFromStateFactoryRecord<SF extends Record<string, (...params:any[]) => any>> = {
  [StateKey in keyof SF]: ReturnType<SF[StateKey]>
}

type StateChangeMachineTransitionContext<
  S,
  SF extends Record<string, (...any:[]) => S>,
  SK extends string & keyof SF = string & keyof SF,
  CP extends any[] = any[],
  M extends StateMachine<ChangeMachineEvent<any, S, S, any>> = StateMachine<ChangeMachineEvent<any, S, S, any>>
> ={
  states: SF,
  transitions: TransitionConfig<
    S,
    { 
      [SK in keyof SF]: ReturnType<SF[SK]>
    }
    ,SK
    ,CP
  >,
  machine: M
}

interface ChangeMachineInternals<Event>
extends 
  TransitionInternals<Event>, 
  StateChangeNotifyInternals<Event>
{
  store: StoreInternals<Event>,
  transition?: (event: Event) => Event | undefined
}

interface StateChangeMachineInternals<
  States extends Record<string, (...any:[]) => State>,  
  S extends ReturnType<States[keyof States]>,
  Event extends ChangeMachineEvent<any, S, S, any>,
>
extends 
  ChangeMachineInternals<Event>, 
  StateChangeNotifyInternals<Event>,
  StateChangeMachineTransitionContext<any,any,any,any>
{
  states: States,
  transitions: TransitionConfig<
    ReturnType<States[keyof States]>, 
    StateRecordFromStateFactoryRecord<States>, 
    string & keyof States, 
    Event['params']
  >, 
  store: StoreInternals<Event>,
  transition?: (event: Event) => Event | undefined
}

const atom = <T>(initial: T): StoreInternals<T> => {
  let value = initial
  return {
    get() {
      return value
    },
    set(newValue: T) {
      value = newValue
    }
  }
}

const defaultInternals = {
  match: (type: string, ...params: any[]) => ({
    type,
    to: 'init',
    from: 'init',
    params
  }),
  guard: (event: AnyMachineChangeEvent) => true,
  handle: (event: AnyMachineChangeEvent) => event,
  enter: (event: AnyMachineChangeEvent) => {},
  exit: (event: AnyMachineChangeEvent) => {}
}


type ResolveTransition<E extends AnyMachineChangeEvent> = (
  from: E['from'],
  type: E['type'],
  ...params: E['params']
) => E | undefined

function createMatcher<
  C extends StateChangeMachineTransitionContext<any,any,any,any>,
  E extends StateChangeMachineEvent<
    any,
    ReturnType<C['states'][keyof C['states']]>,
    ReturnType<C['states'][keyof C['states']]>,
    any[]
  >
>(
  context: C
): ResolveTransition<E> {
  const { states, transitions, machine } = context
  return (from, type, ...params) => {
    const to = transitions[from][type]
    if (!to) return undefined
    if (typeof to === "function") {
      const targetStateOrFunc = to(...params);
      return typeof targetStateOrFunc === "function"
        ? (targetStateOrFunc)(from, type, context, machine)
        : targetStateOrFunc;
    } else {
      return states[to as keyof typeof states](...params) as any;
    }
  }
}

type CreateStateChangeMachineProps =
  StateChangeMachineTransitionContext<any,any,any,any>
  & Partial<StateChangeMachineInternals<any,any,any>>

function createStateChangeMachine<
  Props extends CreateStateChangeMachineProps,
  E extends AnyMachineChangeEvent,
>(
  options: Props  
): StateMachine<E> {
  const internals = {
    ...defaultInternals,
    ...options,
    store: options.store || atom<E>({} as E),
    matcher: options.match || createMatcher(options)
  } as ChangeMachineInternals<E>
  if (!internals.store) internals.store = atom<E>({} as E)
  return {
    getChange: () => internals.store.get(),
    getState: () => internals.store.get().to,
    send: (type, ...params) => {
      const lastEvent = internals.store.get();
      const nextState = internals.match({ ...lastEvent, type, params });
      if (!nextState) return;
      const nextEvent = {
        ...lastEvent,
        type,
        from: lastEvent.to,
        to: nextState
      }
      if (
        !internals.guard(nextEvent)
      )
        return;
      const handled = internals.handle(nextEvent);
      if (!handled) return;
      internals.store.set(handled);
      internals.exit(handled);
      internals.enter(handled);
    },
  };
}

type StateMachineHooks<E extends AnyMachineChangeEvent> = {
  match?: Middleware<Omit<E, "to">>;
  guard?: Middleware<E>;
  handle?: Middleware<E>;
  enter?: Middleware<E>;
  exit?: Middleware<E>;
};

function createMachineWithHooks<
  C extends CreateStateChangeMachineProps,
  E extends AnyMachineChangeEvent,
>(  
  options: C,
  hooks: StateMachineHooks<E>
){
  const internals: C & {hooks: StateMachineHooks<E>} = {
    ...options,
    hooks,
    match: event => {
      let result: E | undefined = undefined
      let match = options.match ?? defaultInternals.match
      internals.hooks.match?.(event, nextEvent => result = nextEvent && match(nextEvent as any))
      return result
    },
    guard: event => {
      let result = true
      let guard = options.guard ?? defaultInternals.guard
      internals.hooks.guard?.(event, (nextEvent) => result = !!nextEvent && guard(nextEvent))
      return result
    },
    handle: event => {
      let result: E| undefined = event
      let handle = options.handle ?? defaultInternals.handle
      internals.hooks.handle?.(event, nextEvent => result = nextEvent && handle(nextEvent))
      return result
    },
    enter: event => {
      internals.hooks.enter?.(event, nextEvent => (internals.enter ?? defaultInternals.enter)(nextEvent ?? event))
    },
    exit: event => {
      internals.hooks.exit?.(event, nextEvent => (internals.exit ?? defaultInternals.exit)(nextEvent ?? event))
    },
  }
  return createStateChangeMachine<C,E>(internals);  
}
