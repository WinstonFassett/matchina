import { StateMachine, TransitionEvent } from "./state-machine";

/**
 * Creates a minimal, pure state machine interface exposing only `getState` and `send`.
 * Useful for consumers who only need to read state and dispatch events, without lifecycle hooks.
 *
 * @param machine - The full StateMachine instance.
 * @returns A PureStateMachine exposing only `getState` and `send`.
 * @source
 * This function is useful for creating a lightweight wrapper around a state machine,
 * allowing consumers to interact with the state machine without needing access to its full lifecycle methods.
 * It provides a simplified interface that focuses on state retrieval and event dispatching.
 *
 * @example
 * ```ts
 * import { matchina } from "matchina";
 *
 * // Create a fancy machine with internal API
 * const machine = matchina({
 *   states: {
 *     Idle: undefined,
 *     Active: (user: string) => ({ user }),
 *   },
 *   transitions: {
 *     Idle: { activate: "Active" },
 *     Active: { deactivate: "Idle" },
 *   },
 *   setup: (machine) => {
 *     // Internal API, hooks, etc.
 *     machine.log = () => console.log(machine.getState());
 *   },
 * });
 *
 * // Expose only the pure facade for external consumers
 * export const publicMachine = pure(machine);
 * // publicMachine exposes only getState and send
 * ```
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
