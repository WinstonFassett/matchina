import { ChangeCommandEvent, ChangeMachine, Commander, Effecter, EventEffects, Guarder, Handler, Notifier, ResolveEvent, Resolver, TransitionContext, TransitionRecord, Transitioner, Updater } from "./machine-types-v3";
import { useOn } from "./use-on";

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
  S extends any = any
>(transitions: TransitionRecord, initialState: S) {
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

export const useGuard = useOn('guard');
export const useHandle = useOn('handle');
export const useEffect = useOn('effect');
export const useBefore = useOn('before');
export const useAfter = useOn('after');
export const useNotify = useOn('notify');
export const useSend = useOn('send');
export const useTransition = useOn('transition');

export function useCleanup (...fns:((...args: any[]) => any) []) {
  return () => {
    for (const fn of fns) {
      fn();
    }
  }
}

const m1 = createStateMachine({
  Idle: {
    'start': 'Running'
  },
  Running: {
    'stop': 'Idle'
  }
}, { key: 'Idle', data: undefined })

useCleanup(
  useGuard(m1, (ev) => { 
    console.log('guard', ev);  
    return true;
  }),

  useHandle(m1, (ev) => { 
    console.log('handle', ev); 
    return ev;
  }),

  useEffect(m1, (ev) => { 
    console.log('effect', ev); 
  }),

  useBefore(m1, (ev) => { 
    console.log('before', ev); 
  }),
)