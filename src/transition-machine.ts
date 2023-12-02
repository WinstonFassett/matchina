import {
  ChangeCommandEvent, ChangeEvent, Effecter,
  EventLifecycle,
  Guarder,
  Handler,
  Notifier,
  TransitionContext,
  TransitionRecord,
  Transitioner
} from "./types";

/*
Flow:
send
  resolve
  transition
    guard
    handle
    update
    effect (move out of update into transition)
      exit
      enter    
    notify
*/




export function transitionMachine<E extends ChangeCommandEvent>(
  transitions: TransitionRecord,
  lastChange: E,
) {
  const machine: TransitionMachine<E> = {
    transitions,
    getChange: () => lastChange,
    getState: () => lastChange.to,
    resolve(ev) {
      const to = machine.transitions[ev.from.key][ev.type];
      if (to) return { ...ev, to } as E;
    },
    guard: (ev: E) => true,
    transition(change: E) {
      if (!machine.guard(change)) return;      
      let update = machine.handle(change); // process change      
      if (!update) return;    
      update = machine.before(update); // prepare update
      if (!update) return
      machine.update(update); // apply update
      machine.effect(update) // internal effects
      machine.notify(update); // notify consumers
      machine.after(update) // cleanup
    },
    handle: (change: E) => change,
    before: (update: E) => update,
    update: (update: E) => { lastChange = update },
    effect(ev: E) {
      machine.leave(ev); // left previous
      machine.enter(ev); // entered next
    },
    leave(ev: E) {
      console.log('left', ev.from.key)
    },
    enter(ev: E) {
      console.log('entered', ev.to.key)
    },
    notify(ev: E) {},
    after(ev: E) {},
  };
  return machine;
}

type TransitionMachine<E extends ChangeCommandEvent> = 
  & TransitionContext 
  & Resolver<E> 
  & EventLifecycle<E> 
  & Transitioner<E> 
  & Guarder<E> 
  & Handler<E> 
  & Effecter<E> 
  & Notifier<E> 
  & ChangeMachine<E>;


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
