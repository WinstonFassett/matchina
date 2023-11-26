import {
  ChangeCommandEvent,
  Effecter,
  EventLifecycle,
  Guarder,
  Handler,
  Notifier,
  TransitionContext,
  TransitionRecord,
  Transitioner,
  Updater,
} from "./types";

export function transitionMachine<E extends ChangeCommandEvent>(
  transitions: TransitionRecord,
  lastChange: E,
) {
  // let lastChange = state;
  const machine = {
    transitions,

    getChange() {
      return lastChange;
    },

    getState() {
      return lastChange.to;
    },

    resolve(ev) {
      const to = machine.transitions[ev.from.key][ev.type];
      if (to) return { ...ev, to } as E;
    },

    guard(ev: E) {
      return true;
    },
    /** begin (guard, before), handle, update (effect(exit, enter, after, notify)), end */
    transition(ev: E) {
      let change = machine.begin(ev)
      if (!change) return;      
      change = machine.handle(change);
      if (change) (machine as unknown as Updater<E>).update(change);
      machine.end(ev)
    },
    begin (ev: E) {
      return machine.guard(ev) ? machine.before(ev) : undefined;      
    },
    end(ev: E) {},
    /** before, apply, effect */
    update(ev: E, runEffects = true) {
      lastChange = ev;
      if(runEffects) machine.effect(ev);
    },

    handle(ev: E) {
      return ev;
    },

    effect(ev: E) {
      machine.exit(ev); // left previous
      machine.enter(ev); // entered next
      machine.after(ev) // did transition
      machine.notify(ev); // notify consumers
    },
    before(ev: E) { return ev as E|undefined },
    after(ev: E) {},
    exit(ev: E) {},
    enter(ev: E) {},
    notify(ev: E) {},
  } as TransitionContext &
    Resolver<E> &
    EventLifecycle<E> &
    Transitioner<E> &
    Guarder<E> &
    Handler<E> &
    Effecter<E> &
    Notifier<E> &
    // & Commander<any,any>
    ChangeMachine<E>;
  return machine;
}
interface Change<T> {
  from: T;
  to: T;
}

export interface ChangeMachine<E extends Change<any>> {
  getState(): E["to"] | E["from"];
  getChange(): E;
  update(change: E): void;
}
export interface Resolver<C extends ChangeEvent<any, any, any>> {
  resolve: (value: ResolveEvent<C>) => C | undefined;
}
export type ResolveEvent<C> = C & {
  to?: never;
};
export interface ChangeEvent<Type extends string = string, To = any, From = any> {
  type: Type;
  to: To;
  from: From;
}

