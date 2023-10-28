import { StateMachine } from "../machine-types";
import { StatesFactory } from "../states";
import { nanosubscriber } from "./nanosubscriber";
import { onUpdate } from "./on-update";

export function withSubscribe(machine: StateMachine<StatesFactory<any>, any>) {
  const [subscribe, emit] =
    nanosubscriber<ReturnType<(typeof machine)["getState"]>>();
  const dispose = onUpdate(machine, (commit, updater) => {
    commit(updater);
    emit(machine.getState());
  });
  return {
    ...machine,
    subscribe,
    dispose,
  };
}
