import {
  ChangeCommandEvent,
  Commander,
  Effecter,
  EventEffects,
  Guarder,
  Handler,
  Notifier,
  TransitionContext,
  TransitionRecord,
  Transitioner,
} from "./types";
import { ResolveEvent } from "./transition-machine";
import { Resolver } from "./transition-machine";
import { ChangeMachine } from "./transition-machine";
import { transitionMachine } from "./transition-machine";

export type StateMachinery<E extends ChangeCommandEvent = ChangeCommandEvent> =
  TransitionContext &
    ChangeMachine<E> &
    Commander<E["type"], E["params"]> &
    Resolver<E> &
    Transitioner<E> &
    Guarder<E> &
    Handler<E> &
    Effecter<E> &
    EventEffects<E> &
    Notifier<E>;

export type AnyStateMachinery = StateMachinery<any>;

export function createStateMachine<E extends ChangeCommandEvent>(
  transitions: TransitionRecord,
  initialState: E["from"],
): StateMachinery<E> {
  const transitioner = transitionMachine(transitions, {
    type: "init",
    to: initialState,
  } as E);
  const machine: StateMachinery<E> = Object.assign(transitioner, {
    send(type, ...params) {
      const lastChange = machine.getChange();
      const resolved = machine.resolve({
        type,
        params,
        from: lastChange.to,
      } as ResolveEvent<E>);
      if (resolved) machine.transition(resolved);
    },
  });
  return machine;
}
