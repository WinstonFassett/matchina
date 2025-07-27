import { StateMachineEvent, StateMachine } from "./state-machine-types";

export function pure<E extends StateMachineEvent>(
  machine: StateMachine<E>,
): PureStateMachine<E> {
  const { getState, send } = machine;
  return {
    getState,
    send,
  };
}
interface PureStateMachine<E extends StateMachineEvent>
  extends Pick<StateMachine<E>, "getState" | "send"> {}
