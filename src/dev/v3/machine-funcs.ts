import {
  ChangeCommandEvent,
  ChangeMachine,
  Commander,
  Effecter,
  EventEffects,
  Guarder,
  Handler,
  Notifier,
  ResolveEvent,
  Resolver,
  TransitionContext,
  TransitionRecord,
  Transitioner,
  Updater
} from "./machine-types-v3";

function transitionMachine<
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
      return { ...ev, to } as E;
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


export function createStateMachine<E extends ChangeCommandEvent>(
  transitions: TransitionRecord,
  initialState: E["from"],
): StateMachinery<E> {
  let lastChange = {
    type: "init",
    to: initialState,
  } as E;
  const transitioner = transitionMachine(transitions, lastChange);
  const machine: StateMachinery<E> = {
    ...transitioner,
    send(type, ...params) {      
      const resolved = machine.resolve({
        type,
        params,
        from: lastChange.to
      } as ResolveEvent<E>);
      if (resolved) machine.transition(resolved);
    },
  };
  return machine;
}

interface PureStateMachine<E extends ChangeCommandEvent<string, any[]>> 
extends Pick<StateMachinery<E>, 'getState' | 'send'> {}

export function pure<E extends ChangeCommandEvent<string, any[]>>(
  machine: StateMachinery<E>
): PureStateMachine<E>  {
  const { getState, send } = machine;
  return {
    getState, 
    send
  } 
}