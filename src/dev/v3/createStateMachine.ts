import { ChangeCommandEvent, ChangeMachine, Commander, Effecter, EventEffects, Guarder, Handler, Notifier, ResolveEvent, Resolver, State, TransitionContext, TransitionRecord, Transitioner, Updater } from "./machine-types-v3";

type StateMachinery<E extends ChangeCommandEvent = ChangeCommandEvent> = 
  & TransitionContext 
  & ChangeMachine<E>
  & Commander<E['type'], E['params']> 
  & Resolver<E> 
  & Transitioner<E> 
  & Guarder<E> 
  & Handler<E> 
  & Effecter<E> 
  & EventEffects<E> 
  & Notifier<E> 

export type AnyStateMachinery = StateMachinery<any>

export function createStateMachine<
  S extends State = State,
  TC extends TransitionRecord = TransitionRecord,
  E extends ChangeCommandEvent<string,any[],S,S> = ChangeCommandEvent<string,any[],S,S>
>(transitions: TC, initialState: S) {
  let lastChange = {
    type: 'init',
    to: initialState
  } as E;
 
  const machine = {
    transitions,

    resolve(ev) {
      const to = machine.transitions[ev.from.key][ev.type];
      return { ...ev, to } as E;
    },

    getChange() { return lastChange; },

    getState() {
      return lastChange.to;
    },

    send(type, ...params) {      
      const resolved = machine.resolve({
        type,
        params,
        from: lastChange.to
      } as ResolveEvent<E>);
      if (resolved) machine.transition(resolved);
    },

    guard(ev: E) {
      return true;
    },

    transition(ev: E) {
      if (!machine.guard(ev)) return;
      const handled = machine.handle(ev);
      if (handled) (machine as unknown as Updater<E>).update(handled);
      return handled;
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
    notify(ev: E) { }
  } as StateMachinery<E>;
  return machine;
}



