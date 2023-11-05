import { StateMachine, TransitionConfig } from "../machine-types";
import { MatchboxFromStatesFactory, StatesMatchboxFactory } from "../states";
import { Subscribe, nanosubscriber } from "./nanosubscriber";
import { onUpdate } from "./on-update";

export function withSubscribe<
  States extends StatesMatchboxFactory<any>,
  Transitions extends TransitionConfig<States>,
>(machine: StateMachine<States, Transitions>) {
  type State = ReturnType<(typeof machine)["getState"]>;
  const [subscribe, emit] = nanosubscriber<State>();
  const s: State = machine.getState();

  const dispose = onUpdate(machine, (commit, updater) => {
    commit(updater);
    emit(machine.getState());
  });
  return Object.assign(machine, {
    subscribe,
    dispose,
  });
}
