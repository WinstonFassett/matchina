
interface StateMachine<State, Type, Params> {
  getState(): State
  send(type: Type, ...params: Params[]): void
}

interface State<K extends string = string> {
  key: K
}

interface ChangeEvent<Type, To, From> {
  type: Type
  to: To
  from: From
}

type AnyChangeEvent = ChangeEvent<any, any, any>

interface StoreInternals<T> {
  get(): T
  set(value: T): void
}

interface TransitionInternals<E> {
  match: (type: string, ...params: any[]) => E,
  guard: (event: E) => boolean,
  handle: (event: E) => E  
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

interface ChangeMachineInternals<
  Event extends AnyChangeEvent
> {
  store: StoreInternals<Event>,
  transition: TransitionInternals<Event>
  notify: StateChangeNotifyInternals<Event>
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

type TransitionToState<S> = S extends State<infer K> ? K : never

type StateEventTransitionConfig<S extends State, Type, Params> = {
  [StateKey in keyof S]: {
    [EventKey in keyof Type]: TransitionToState<S>
  }
}

const defaultInternals = {
  transition: {
    match: (type: string, ...params: any[]) => ({
      type,
      to: 'init',
      from: 'init',
      params
    }),
    guard: (event: AnyChangeEvent) => true,
    handle: (event: AnyChangeEvent) => event
  },
  notify: {
    enter: (event: AnyChangeEvent) => {},
    exit: (event: AnyChangeEvent) => {}
  }
}

function createStateChangeMachine<
State,
Type,
Params extends any[] = any[],
E extends ChangeMachineEvent<Type, State, State, Params> = ChangeMachineEvent<Type, State, State, Params>,
>(
  options: Partial<ChangeMachineInternals<E>>
) {
  const internals = {
    ...defaultInternals,
    ...options,
    store: options.store || atom<E>({} as E)
  } as ChangeMachineInternals<E>
  if (!internals.store) internals.store = atom<E>({} as E)
  return {
    getChange: () => internals.store.get(),
    getState: () => internals.store.get().to,
    send: (type: string, ...params: Params) => {
      const nextState = internals.transition.match(type, ...params);
      if (!nextState) return;
      const lastEvent = internals.store.get();
      const nextEvent = {
        ...lastEvent,
        type,
        from: lastEvent.to,
        to: nextState
      }
      if (
        !internals.transition.guard(nextEvent)
      )
        return;
      const handled = internals.transition.handle(nextEvent);
      if (!handled) return;
      internals.notify.exit(lastEvent);
      internals.store.set(handled);
      internals.notify.enter(handled);
    },
  };
}

function createMachineWithHooks () {
  // TODO: type and implement
}

