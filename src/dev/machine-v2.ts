import { Middleware } from '../extras/middleware'
interface StateMachine<E extends AnyMachineChangeEvent> {
  getState(): E['to'] | E['from']
  getChange(): E
  send(type: E['type'], ...params: E['params']): void
}

interface State<K extends string = string> {
  key: K
}

interface ChangeEvent<Type, To, From> {
  type: Type
  to: To
  from: From
}

interface StoreInternals<T> {
  get(): T
  set(value: T): void
}

interface TransitionInternals<E extends AnyMachineChangeEvent> {
  match: (event: Omit<E, 'to'>) => E | undefined,
  guard: (event: E) => boolean,
  handle: (event: E) => E | undefined 
}

interface StateChangeNotifyInternals<E> {
  enter: (event: E) => void
  exit: (event: E) => void
}

interface ChangeMachineEvent<Type, To, From, Params>
extends ChangeEvent<Type, To, From>
{
  params: Params
}
type AnyMachineChangeEvent = ChangeMachineEvent<any, any, any, any>

interface ChangeMachineInternals<
  Event extends AnyMachineChangeEvent
>
extends TransitionInternals<Event>, StateChangeNotifyInternals<Event>
{
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

type TransitionToState<E, StateKey, EventKey> = 
  E extends State<infer K> 
    ? K 
    : never

type StateEventTransitionConfig<E extends AnyMachineChangeEvent> = {
  [StateKey in keyof (E['from'])]: {
    [EventKey in keyof E['type']]: TransitionToState<E, StateKey, EventKey>
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

function createStateChangeMachine<
E extends AnyMachineChangeEvent
>(
  options: Partial<ChangeMachineInternals<E>>
): StateMachine<E> {
  const internals = {
    ...defaultInternals,
    ...options,
    store: options.store || atom<E>({} as E)
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

type ChangeMachineWithHooksInternals<E extends AnyMachineChangeEvent> =
  ChangeMachineInternals<E> & {
    hooks: StateMachineHooks<E>;
  };

type StateMachineHooks<E extends AnyMachineChangeEvent> = {
  match?: Middleware<Omit<E, "to">>;
  guard?: Middleware<E>;
  handle?: Middleware<E>;
  enter?: Middleware<E>;
  exit?: Middleware<E>;
};

function createMachineWithHooks<E extends AnyMachineChangeEvent>(
  options: ChangeMachineInternals<E>,
  hooks: StateMachineHooks<E>
){
  const internals: ChangeMachineWithHooksInternals<E> = {
    ...options,
    hooks,
    match: event => {
      let result: E | undefined = undefined
      let match = options.match ?? defaultInternals.match
      internals.hooks.match?.(event, nextEvent => result = nextEvent && match(nextEvent))
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
  return createStateChangeMachine<E>(internals);  
}
