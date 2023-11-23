import { StateMachinery } from "./state-machine";
import { ChangeCommandEvent } from "./types";

export function pure<E extends ChangeCommandEvent<string, any[]>>(
  machine: StateMachinery<E>,
): PureStateMachine<E> {
  const { getState, send } = machine;
  return {
    getState,
    send,
  };
}
interface PureStateMachine<E extends ChangeCommandEvent<string, any[]>>
  extends Pick<StateMachinery<E>, "getState" | "send"> {}
