
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


interface StoreInternals<T> {
  get(): T
  set(value: T): void
}

interface TransitionInternals<E extends AnyMachineChangeEvent> {
  match: (type: E['type'], ...params: E['params']) => E,
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
type AnyMachineChangeEvent = ChangeMachineEvent<any, any, any, any>

interface ChangeMachineInternals<
  Event extends AnyMachineChangeEvent
>
extends TransitionInternals<Event>, StateChangeNotifyInternals<Event>
{
  store: StoreInternals<Event>,
  // transition: TransitionInternals<Event>
  // notify: StateChangeNotifyInternals<Event>
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
    send: (type: string, ...params: E['params']) => {
      const nextState = internals.match(type, ...params);
      if (!nextState) return;
      const lastEvent = internals.store.get();
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
      internals.exit(lastEvent);
      internals.enter(handled);
    },
  };
}

function createMachineWithHooks<E extends AnyMachineChangeEvent>(
  hooksConfig: {
    guard?: (event: E) => boolean,
    transition?: (event: E) => E,
    handle?: (event: E) => E,
    enter?: (event: E) => void,
    exit?: (event: E) => void,
  }
) {
  // Create the state change machine with overridden internals using hooks
  const machine = createStateChangeMachine<E>({    
    guard: hooksConfig.guard,
    handle: hooksConfig.handle,
    enter: hooksConfig.enter,
    exit: hooksConfig.exit,
  });

  // Return the machine with the custom internals
  return machine;
}