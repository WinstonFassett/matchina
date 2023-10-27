import { StatesFactory } from "../states";
import { StateMachine, TransitionConfig } from "../machine-types";

export function makeZen<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
>(machine: StateMachine<States, Transitions>) {
  const { send, reset, event } = machine;

  return {
    ...Object.assign({}, event),
    get state() {
      return machine.getState();
    },
    get machine() {
      return machine;
    },
    send,
    reset,
  };
}
