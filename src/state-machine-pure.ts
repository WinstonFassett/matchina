import { StateMachine, TransitionEvent } from "./state-machine";

export function pure<E extends TransitionEvent>(
  machine: StateMachine<E>
): PureStateMachine<E> {
  const { getState, send } = machine;
  return {
    getState,
    send,
  };
}
interface PureStateMachine<E extends TransitionEvent>
  extends Pick<StateMachine<E>, "getState" | "send"> {}
