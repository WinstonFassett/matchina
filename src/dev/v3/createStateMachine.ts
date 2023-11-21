import { StateFromFactory } from "../v2/machine-types-v2";
import { ChangeCommandEvent, AnyStatesFactory, Resolver, TransitionRecord, ResolveEvent, TransitionContext, EventEffects, Transitioner, Guarder, Notifier, ChangeMachine, Handler, Effecter, Updater, Commander } from "./machine-types-v3";

type StateMachinery<E extends ChangeCommandEvent, T extends string = string, P extends any[] = any[]> = 
  & TransitionContext 
  & ChangeMachine<E>
  & Commander<any, any> 
  & Resolver<E> 
  & Transitioner<E> 
  & Guarder<E> 
  & Handler<E> 
  & Effecter<E> 
  & EventEffects<E> 
  & Notifier<E> 

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
      if (typeof type === 'string') {
        type = { params } as ResolveEvent<E>;
      }
      if (params) {
        type.params = (type.params ?? []).concat(params);
      }
      const resolved = machine.resolve(type as ResolveEvent<E>);
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
  K extends keyof T,
  T extends Record<string, (...params: any[]) => any> = Record<string, (...params: any[]) => any>,
>(methodName: K) {
  return function extend(target: T, fn: T[K]) {
    const original = target[methodName];
    target[methodName] = (fn) as T[K];
    return () => {
      target[methodName] = original;
    };
  }
}

export const onGuard = onMethod('guard');
export const onHandle = onMethod('handle');
export const onEffect = onMethod('effect');
export const onBefore = onMethod('before');
export const onAfter = onMethod('after');
export const onNotify = onMethod('notify');
export const onSend = onMethod('send');

