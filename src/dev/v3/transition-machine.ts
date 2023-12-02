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

  // let lastChange = state;
  const machine: TransitionMachine<E> = {
    transitions,
    getChange: () => lastChange,
    getState: () => lastChange.to,
    resolve(ev) {
      const to = machine.transitions[ev.from.key][ev.type];
      if (to) return { ...ev, to } as E;
    },
    guard: (ev: E) => true,
    transition(ev: E) {
      if (!machine.guard(ev)) return;      
      const change = machine.handle(ev); // process change      
      if (!change) return;    
      const update = machine.before(change); // prepare update
      if (!update) return
      machine.update(update); // apply update
      machine.effect(update) // internal effects
      machine.notify(update); // notify consumers
      machine.after(update) // cleanup
    },
    before: (ev: E) => ev,
    update: (ev: E) => { lastChange = ev },
    handle: (ev: E) => ev,
    effect(ev: E) {
      machine.exit(ev); // left previous
      machine.enter(ev); // entered next
    },
    exit(ev: E) {},
    enter(ev: E) {},
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
export interface ChangeEvent<Type extends string = string, To = any, From = any> {
  type: Type;
  to: To;
  from: From;
}

