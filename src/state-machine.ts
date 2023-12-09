import {
  TransitionContext,
  TransitionRecord
} from "./types";

export interface StateMachineEvent<To = any, From = To>  {
  type: string;
  params: any[];
  to: To;
  from: From;
  get machine(): StateMachinery<StateMachineEvent<To,From>>;
}


export type ResolveEvent<C> = Omit<C, 'to'>;

export interface StateMachinery<E extends StateMachineEvent = StateMachineEvent> {
  getState(): E["to"] | E["from"];
  getChange(): E;
  send: (type: E['type'], ...params: E['params']) => void;
  resolve(ev: ResolveEvent<E>): E | undefined;
  transition(change: E): void;
  guard(ev: E): boolean;
  handle(ev: E): E | undefined;
  before(ev: E): E | undefined;
  update(ev: E): void;
  effect(ev: E): void;
  leave(ev: E): void;
  enter(ev: E): void;
  notify(ev: E): void;
  after(ev: E): void;
}
export function createStateMachine<E extends StateMachineEvent>(
  transitions: TransitionRecord,
  initialState: E["from"],
) {  
  let lastChange = {
    type: "init",
    to: initialState,
  } as E;
  const machine:  StateMachinery<E> & TransitionContext = {
    transitions,
    getChange: () => lastChange,
    getState: () => lastChange.to,
    send(type, ...params) {
      const lastChange = machine.getChange();
      const resolved = machine.resolve({
        type,
        params,
        from: lastChange.to,
      } as ResolveEvent<E>);
      if (resolved) {
        machine.transition(resolved);
      }
    },
    resolve(ev) {
      const to = machine.transitions[ev.from.key][ev.type];
      if (to) {
        return { ...ev, to } as E;
      }
    },
    guard: (ev: E) => true,
    transition(change: E) {
      if (!machine.guard(change)) {
        return;
      }
      let update = machine.handle(change); // process change
      if (!update) {
        return;
      }
      update = machine.before(update); // prepare update
      if (!update) {
        return;
      }
      machine.update(update); // apply update
      machine.effect(update); // internal effects
      machine.notify(update); // notify consumers
      machine.after(update); // cleanup
    },
    handle: (change: E) => change,
    before: (update: E) => update,
    update: (update: E) => {
      lastChange = update;
    },
    effect(ev: E) {
      machine.leave(ev); // left previous
      machine.enter(ev); // entered next
    },
    leave(ev: E) {
      console.log("left", ev.from.key);
    },
    enter(ev: E) {
      console.log("entered", ev.to.key);
    },
    notify(ev: E) {},
    after(ev: E) {},
  };
  return machine;
}