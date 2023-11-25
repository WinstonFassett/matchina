import {
  ChangeCommandEvent,
  Effecter,
  EventEffects,
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

    transition(ev: E) {
      if (!machine.guard(ev)) return;
      const handled = machine.handle(ev);
      if (handled) (machine as unknown as Updater<E>).update(handled);
    },

    update(ev: E) {
      lastChange = ev;
      machine.effect(ev);
      machine.notify(ev);
    },

    handle(ev: E) {
      return ev;
    },

    effect(ev: E) {
      machine.before(ev); // left previous
      machine.after(ev); // entered next
    },

    before(ev: E) {},
    after(ev: E) {},
    notify(ev: E) {},
  } as TransitionContext &
    Resolver<E> &
    EventEffects<E> &
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
}export interface Resolver<C extends ChangeEvent<any, any, any>> {
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

