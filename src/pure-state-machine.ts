import { StateMachineEvent, StateMachinery } from "./state-machine";
import { ChangeCommandEvent } from "./types";

export function pure<E extends StateMachineEvent>(
  machine: StateMachinery<E>,
): PureStateMachine<E> {
  const { getState, send } = machine;
  return {
    getState,
    send,
  };
}
interface PureStateMachine<E extends StateMachineEvent>
  extends Pick<StateMachinery<E>, "getState" | "send"> {}
