import { StateFromFactory, StateMachine } from "../v2/machine-types-v2";
import { ChangeCommandEvent, AnyStatesFactory, Resolver, TransitionRecord, ResolveEvent, TransitionContext, EventEffects, Transitioner, Guarder, Notifier, ChangeMachine, Handler, Effecter, Updater, Commander } from "./machine-types-v3";

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

type AnyStateMachinery = StateMachinery<any>

export function createStateMachine<
  E extends ChangeCommandEvent,
  SF extends AnyStatesFactory
>(transitions: TransitionRecord, initialState: StateFromFactory<SF>) {
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

export function onMethod<
  T, 
  K extends keyof T = keyof T
>(methodName: K) {
  return function extend(target: T, fn: T[K]) {
    const original = target[methodName];
    target[methodName] = (fn) as T[K];
    return () => {
      target[methodName] = original;
    };
  }
}

export const onGuard = onMethod<AnyStateMachinery>('guard');
export const onHandle = onMethod<AnyStateMachinery>('handle');
export const onEffect = onMethod<AnyStateMachinery>('effect');
export const onBefore = onMethod<AnyStateMachinery>('before');
export const onAfter = onMethod<AnyStateMachinery>('after');
export const onNotify = onMethod<AnyStateMachinery>('notify');
export const onSend = onMethod<AnyStateMachinery>('send');

