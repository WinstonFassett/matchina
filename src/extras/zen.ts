import {
  StateMachine,
  StatesFactory,
  TransitionConfig,
} from "../machine-types";
import { withEvents } from "./with-events";
import { withSubscribe } from "./with-subscribe";

export function makeZen<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
>(machine: StateMachine<Transitions, States>) {
  
  const zenMachine = withSubscribe(withEvents(machine));
  // hmm this is a class now
  const { send, reset, event, subscribe, when } = zenMachine;

  return {
    ...Object.assign({}, event),
    get state() {
      return machine.getState();
    },
    get change() {
      return machine.getChange();
    },
    get machine() {
      return zenMachine;
    },
    send,
    reset,
    subscribe,
    when
  };
}
