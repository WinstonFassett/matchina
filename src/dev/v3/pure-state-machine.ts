import { StateMachinery } from "./StateMachinery";
import { ChangeCommandEvent } from "./machine-types-v3";



export function pure<E extends ChangeCommandEvent<string, any[]>>(
  machine: StateMachinery<E>
): PureStateMachine<E> {
  const { getState, send } = machine;
  return {
    getState,
    send
  };
}
interface PureStateMachine<E extends ChangeCommandEvent<string, any[]>>
  extends Pick<StateMachinery<E>, 'getState' | 'send'> {
}
