import { StateMachine, TransitionConfig } from "../machine-types";
import { StatesFactory } from "../states";
import { nanosubscriber } from "./nanosubscriber";
import { onUpdate } from "./on-update";

export function withSubscribe<
States extends StatesFactory<any>,
Transitions extends TransitionConfig<States>,
>(machine: StateMachine<States, Transitions>) {
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
export type SubscribableMachine<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
> = ReturnType<typeof withSubscribe<States, Transitions>>;