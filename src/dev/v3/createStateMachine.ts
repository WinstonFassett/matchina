import { ChangeCommandEvent, ChangeMachine, Commander, Effecter, EventEffects, Guarder, Handler, Notifier, ResolveEvent, Resolver, TransitionContext, TransitionRecord, Transitioner, Updater } from "./machine-types-v3";
// import { useOn } from "./use-on";

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
  T extends TransitionRecord,
  E extends ChangeCommandEvent,
  S extends any = any
>(transitions: T, initialState: S) {
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

type HasMethod<K extends string> = {
  [key in K]: (...args: any[]) => any;
};
export function use<K extends string, T extends HasMethod<K> = HasMethod<K>>(methodName: K, target: T, fn: T[K]) {
  const original = target[methodName];
  target[methodName] = (fn) as T[K];
  return () => {
    target[methodName] = original;
  };
}

// export const useOn =
//   <K extends string>(methodName: K) =>
//   <T extends HasMethod<K>>(target: T, fn: T[K]) =>
//     use(methodName, target, fn);

export const user =
  <K extends string>(methodName: K) =>
  <T extends HasMethod<K>>(fn: T[K]) => (target: T) =>
    use(methodName, target, fn);    

const guard = user('guard')
const handle = user('handle')
const effect = user('effect')
const before = user('before')
const after = user('after')
const notify = user('notify')
const send = user('send')
const transition = user('transition')


export function useCleanup (...fns:((...args: any[]) => any) []) {
  return () => {
    for (const fn of fns) {
      fn();
    }
  }
}

function machineSetup<M>(...extenders: ((machine:M)=>()=>void)[]) {
  return function setupMachine(machine:M) {
    return useCleanup(...extenders.map(fn => fn(machine)))
  }  
}

function setupMachine<M>(machine:M) {
  return function (...extenders: ((machine:M)=>()=>void)[]) {
    return useCleanup(...extenders.map(fn => fn(machine)))
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

setupMachine(m1)(
  guard(ev=> true),
  before(ev=> console.log('before', ev)),
)

const m2 = createStateMachine({
  Idle: {
    'start': 'Running'
  },
  Running: {
    'stop': 'Idle'
  }
}, { key: 'Idle', data: undefined })

machineSetup<typeof m2>(
  guard(ev=> true),
  before(ev=> console.log('before', ev)),
)(m2)

