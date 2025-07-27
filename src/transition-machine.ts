import {
  StateMachineEvent,
  StateMachine,
  ResolveEvent,
} from "./state-machine-types";

export const EmptyTransform = <E>(event: E) => event;
export const EmptyEffect = <E>(_event: E) => {};

export type TransitionRecord = {
  [from: string]: {
    [type: string]: string | object;
  };
};
export interface TransitionContext {
  transitions: TransitionRecord;
}

export function createTransitionMachine<E extends StateMachineEvent>(
  transitions: TransitionRecord,
  initialState: E["from"]
) {
  let lastChange = {
    type: "__initialize",
    to: initialState,
  } as E;
  const machine: StateMachine<E> & TransitionContext = {
    transitions,
    getChange: () => lastChange,
    getState: () => lastChange.to,
    send(type, ...params) {
      const lastChange = machine.getChange();
      const resolved = machine.resolveExit({
        type,
        params,
        from: lastChange.to,
      } as ResolveEvent<E>);
      if (resolved) {
        machine.transition(resolved);
      }
    },
    resolveExit(ev) {
      const to = machine.transitions[ev.from.key][ev.type];
      if (to) {
        return { ...ev, to } as E; // TODO: use Object.assign
      }
    },
    guard: (ev: E) => !!ev,
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
    handle: EmptyTransform<E>,
    before: EmptyTransform<E>,
    update: (update: E) => {
      lastChange = update;
    },
    effect(ev: E) {
      machine.leave(ev); // left previous
      machine.enter(ev); // entered next
    },
    leave: EmptyEffect<E>,
    enter: EmptyEffect<E>,
    notify: EmptyEffect<E>,
    after: EmptyEffect<E>,
  };
  return machine;
}
