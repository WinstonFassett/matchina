import {
  ChangeCommandEvent,
  ChangeMachine, Effecter,
  EventEffects,
  Guarder,
  Handler,
  Notifier, Resolver,
  TransitionContext,
  TransitionRecord,
  Transitioner,
  Updater
} from "./types";

export function transitionMachine<
  E extends ChangeCommandEvent
>(transitions: TransitionRecord, lastChange: E) {
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
    },

    handle(ev: E) {
      return ev;
    },

    effect(ev: E) {
      machine.before(ev);
      machine.after(ev);
      machine.notify(ev);
    },

    before(ev: E) { },
    after(ev: E) { },
    notify(ev: E) { },
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
