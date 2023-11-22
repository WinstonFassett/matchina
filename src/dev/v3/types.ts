import { Middleware } from "../../extras/middleware"

type Effect<T> = (value: T) => void

export interface Change<T> {
  from: T,
  to: T
}

export interface ChangeMachine<E extends Change<any>> {
  getState(): E['to']|E['from']
  getChange(): E
  update(change: E): void 
}

interface Setter<T> {
  set: (value: T) => void,
}
export interface Notifier<T> {
  notify: (value: T) => void,
}

export interface Updater<T> {
  update: (value: T) => void,
}

interface ChangeNotifier<T> {
  exit<T>(value: T): void,
  enter<T>(value: T): void,
}

interface TEvent<T extends string> {
  type: T,
}

interface ChangeEvent<Type extends string = string, To=any, From=any> 
extends TEvent<Type>
  {
  type: Type;
  to: To;
  from: From;
}


interface CommandEvent<T, P extends any[]> {
  type: T,
  params: P
}

export interface ChangeCommandEvent<
  T extends string = string,
  P extends any[] = any[],
  To extends any = any,
  From extends any = To
> extends ChangeEvent<T, To, From>,
    CommandEvent<T, P> {}

export type Commander<T,P extends any[]> = {
  send: (type: T, ...params: P) => void,
}

export interface Handler<T> {
  handle: (value: T) => T,
}

export interface Effecter<T> {
  effect: (value: T) => void,
}

export interface Guarder<T> {
  guard: (value: T) => boolean,
}

export type ResolveEvent<C> = C & {
  to?: never
}

export interface Resolver<C extends ChangeEvent<any, any, any>> {
  resolve: (value: ResolveEvent<C>) => C | undefined,
}

type Dispose = () => void

interface Usable<T> {
  use(mw: Middleware<T>): Dispose,
}

interface Machine<T> {
  getState(): T,
  update(value: T): void,
}



export interface Extender<T, X> {
  extend(value: T): X & T,
}

export interface Transitioner<T> {
  transition: (value: T) => T,
}


export interface EventEffects<T> {
  before: (value: T) => void,
  after: (value: T) => void,
}

interface StateAfterEffects<T> {
  leave : (value: T) => void,
  enter: (value: T) => void,
}

interface Eventware<E> {
  before: (m: Middleware<E>) => void,
  after: (m: Effect<E>) => void,
}

interface FactoryTransitionMachine {}

export type TransitionRecord<T = any> = Record<
  string,
  Record<string, T>
>;

export interface State<K extends string = string, D = any> {
  key: K;
  data?: D; // TODO: make data optional
}
export type AnyStatesFactory = Record<string, (...params: any[]) => State>;


export type StateFromFactory<
  States extends AnyStatesFactory,
  StateKey extends keyof States = keyof States,
> = ReturnType<States[StateKey]>;


class StateTransitionResolverImpl {
  public states: AnyStatesFactory
  public transitions: TransitionRecord
  
  resolve (ev: ResolveEvent<ChangeEvent>) {
    const to = this.transitions[ev.from.key][ev.type]
    return {...ev, to }
  }
}

interface StatesContext<S> {
  states: S
}

export interface TransitionContext {
  transitions: TransitionRecord
}

interface StateTransitionContext<S, T> 
extends StatesContext<S>
, TransitionContext
{
  // change: ChangeMachine<T>,
}


class ExtensionImpl<E> {
  use (mw: Middleware<E>) {
    return () => {}
  }

  extend<T>(fn: (it: this) => T) {
    return fn(this)
  }
}

class EventSubscriberImpl<E> {
  events: Record<string, Effect<E>[]>
  constructor() {
    this.events = {}
  }
  on (type: string, ...effects: Effect<E>[]) {
    this.events[type] = (this.events[type] ?? []).concat(effects)
    return () => {
      this.events[type] = this.events[type].filter(x => !effects.includes(x))
    }
  }
  notify (ev: E) {
    const effects = this.events[(ev as any).type]
    if (effects) {
      effects.forEach(effect => effect(ev))
    }
  }
}