import {
  StateMachine,
  StatesFactory,
  TransitionConfig,
} from "../machine-types";
import { withEvents } from "./with-events";

export function makeZen<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
>(machine: StateMachine<States, Transitions>) {
  const eventMachine = withEvents(machine);
  const { send, reset, event } = eventMachine;

  return {
    ...Object.assign({}, event),
    get state() {
      return machine.getState();
    },
    get machine() {
      return eventMachine;
    },
    send,
    reset,
  };
}
