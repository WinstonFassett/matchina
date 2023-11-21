import {
  AnyStatesFactory,
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
  Updater,
} from "./machine-types-v3";

function transitionMachine<
  E extends ChangeCommandEvent,
  SF extends AnyStatesFactory,
>(transitions: TransitionRecord, lastChange: E) {
  // let lastChange = state;

  const machine = {
    transitions,
    resolve(ev) {
      const to = machine.transitions[ev.from.key][ev.type];
      return { ...ev, to } as E;
    },

    getChange() {
      return lastChange;
    },

    getState() {
      return lastChange.to;
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

interface StateMachine<E extends ChangeCommandEvent>
  extends TransitionContext,
    ChangeMachine<E>,
    Commander<any, any>,
    Resolver<E>,
    Transitioner<E>,
    Guarder<E>,
    Handler<E>,
    Effecter<E>,
    EventEffects<E>,
    Notifier<E> {
  send(type: string | ResolveEvent<E>, ...params: any[]): void;
}

function createStateMachine<E extends ChangeCommandEvent>(
  transitions: TransitionRecord,
  initialState: E["from"],
): StateMachine<E> {
  let lastChange = {
    type: "init",
    to: initialState,
  } as E;
  const transitioner = transitionMachine(transitions, lastChange);
  const machine: StateMachine<E> = {
    ...transitioner,
    send(type, ...params) {
      if (typeof type === "string") {
        type = { params } as ResolveEvent<E>;
      }
      if (params) {
        type.params = (type.params ?? []).concat(params);
      }
      const resolved = machine.resolve(type as ResolveEvent<E>);
      if (resolved) machine.transition(resolved);
    },
  };
  return machine;
}
