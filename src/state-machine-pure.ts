import { StateMachine, TransitionEvent } from "./state-machine";

/**
 * Creates a minimal, pure state machine interface exposing only `getState` and `send`.
 * Useful for consumers who only need to read state and dispatch events, without lifecycle hooks.
 *
 * @param machine - The full StateMachine instance.
 * @returns A PureStateMachine exposing only `getState` and `send`.
 */
export function pure<E extends TransitionEvent>(
  machine: StateMachine<E>
): PureStateMachine<E> {
  const { getState, send } = machine;
  return {
    getState,
    send,
  };
}

/**
 * PureStateMachine exposes only the minimal API: `getState` and `send`.
 * This is a lightweight wrapper for consumers who do not need full lifecycle access.
 */
interface PureStateMachine<E extends TransitionEvent>
  extends Pick<StateMachine<E>, "getState" | "send"> {}
