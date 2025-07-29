import type { StateMachine } from "../state-machine";
import { Subscribe, emitter } from "./emitter";

/**
 * Enhances a StateMachine with a subscribe method for event notifications.
 *
 * Use cases:
 * - Adding pub/sub capability to state machines
 * - Allowing external listeners to react to state changes or events
 * - Useful for event-driven architectures and reactive programming
 *
 * @template T - The StateMachine type with a notify method
 * @template E - The event type handled by notify
 * @param target - The state machine to enhance
 * @returns The enhanced state machine with a subscribe method
 * @source This function is useful for scenarios where you want to allow external code to subscribe
 * to events or changes emitted by a state machine. It wraps the notify method to emit events to subscribers,
 * enabling reactive patterns and decoupled event handling.
 *
 * @example
 * ```ts
 * const machine = { notify: (ev: string) => undefined };
 * const enhanced = withSubscribe(machine);
 * enhanced.subscribe((ev: string) => console.log('Event:', ev));
 * enhanced.notify('test'); // Logs: 'Event: test'
 * ```
 */
export const withSubscribe = <
  T extends Pick<StateMachine<any>, "notify">,
  E extends Parameters<T["notify"]>[0],
>(
  target: T & Partial<{ subscribe: Subscribe<E> }>
) => {
  if (!target.subscribe) {
    const notify = target.notify.bind(target);
    const [subscribe, emit] = emitter<Parameters<T["notify"]>[0]>();
    target.notify = (ev) => {
      notify(ev);
      emit(ev);
    };
    target.subscribe = subscribe;
  }
  return target as T & { subscribe: typeof target.subscribe };
};
