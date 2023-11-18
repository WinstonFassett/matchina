import { Middleware } from '../extras/middleware'
interface StateMachine<E extends AnyMachineChangeEvent> {
  getState(): E['to'] | E['from']
  getChange(): E
  send(type: E['type'], ...params: E['params']): void
}

// type StatesRecord<K extends string, S extends State> = Record<K, S>

type TransitionConfig<
  SF extends Record<string, (...params:any[]) => any>,
  CP extends any[] = any[]
> = {
  [FromStateKey in string & keyof SF]: {
    [EventKey in string]:
      | keyof SF
      | ((...params: any[]) => ReturnType<SF[keyof SF]>)
      | ((...params: any[]) => (...context: CP) => ReturnType<SF[keyof SF]>);
  };
};

// S,
// { 
//   [SK in keyof SF]: ReturnType<SF[SK]>
// }
// ,SK
// ,CP


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
type AnyChangeEvent = ChangeEvent<any, any, any>

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

interface TransitionInternals<E extends AnyMachineChangeEvent> {
  resolve: ResolveTransition<E>
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

interface StateChangeMachineTransitionContext<
  SF extends Record<string, (...any:[]) => State>,
> {
  states: SF,
  transitions: TransitionConfig<SF>,
}

interface StateChangeMachineTransitionRuntimeContext<
  SF extends Record<string, (...any:[]) => State>,
  M extends StateMachine<
    MachineContextEvent<StateChangeMachineTransitionContext<SF>>    
  >
>
extends StateChangeMachineTransitionContext<SF> 
{
  machine: M
}

interface MachineContextEvent<
  Context extends StateChangeMachineTransitionContext<any>,
  CP extends any[] = any[]
> extends
  StateChangeMachineEvent<
    string & keyof Context[keyof Context], // flat event keys from context.transitions
    ReturnType<Context['states'][keyof Context['states']]>,
    ReturnType<Context['states'][keyof Context['states']]>,
    CP
  >{
    // match
  }



interface ChangeMachineInternals<Event extends AnyMachineChangeEvent>
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
  StateChangeMachineTransitionContext<States>
{
  states: States,
  transitions: TransitionConfig<States>, 
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

const emptyEffect = <E>(event: E) => {}

const defaultInternals = {
  guard: (event: AnyMachineChangeEvent) => true,
  handle: (event: AnyMachineChangeEvent) => event,
  enter: emptyEffect,
  exit: emptyEffect
}


type ResolveTransition<E extends AnyMachineChangeEvent> = (
  event: ResolveEvent<E>
) => E | undefined

function createResolver<
  C extends StateChangeMachineTransitionContext<any>,
  E extends MachineContextEvent<C> = MachineContextEvent<C>
>(
  context: C
): ResolveTransition<E> {
  const { states, transitions } = context
  const { machine } = context as any // TODO: fix typing here
  return ({ from, type, params }) => {
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

export type CreateStateChangeMachineProps<> =
  StateChangeMachineTransitionContext<any>
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
    resolver: options.resolve || createResolver(options)
  } as ChangeMachineInternals<E>
  if (!internals.store) internals.store = atom<E>({} as E)
  return {
    getChange: () => internals.store.get(),
    getState: () => internals.store.get().to,
    send: (type, ...params) => {
      const lastEvent = internals.store.get();
      const nextState = internals.resolve({
        ...lastEvent,
        from: lastEvent.to,
        type
      });
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

type ResolveEvent<E> = Omit<E, "to">;

type StateMachineHooks<E extends AnyMachineChangeEvent> = {
  resolve?: Middleware<ResolveEvent<E>>;
  guard?: Middleware<E>;
  handle?: Middleware<E>;
  enter?: Middleware<E>;
  exit?: Middleware<E>;
};

export function createMachineWithHooks<
  C extends CreateStateChangeMachineProps,
  E extends MachineContextEvent<C> = MachineContextEvent<C>,
>(  
  options: C,
  hooks: StateMachineHooks<E>
){
  const internals: C & {hooks: StateMachineHooks<E>} = {
    ...options,
    hooks,
    resolve: (event) => {
      let result: E | undefined = undefined
      let resolve = options.resolve ?? createResolver(options)
      internals.hooks.resolve?.(event, nextEvent => result = nextEvent && resolve(nextEvent))
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
