import { StateMachine, TransitionConfig } from "../machine-types";
import { StateFromFactory, StatesFactory } from "../states";
import { Subscribe, nanosubscriber } from "./nanosubscriber";
import { onUpdate } from "./on-update";

export function withSubscribe<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
>(machine: StateMachine<States, Transitions>) {
  type M = typeof machine;
  type State = StateFromFactory<M["def"]["states"]>;
  const [subscribe, emit] = nanosubscriber<State>();
  const dispose = onUpdate(machine, (commit, updater) => {
    commit(updater);
    emit(machine.getState());
  });
  return {
    ...machine,
    subscribe,
    dispose,
  } as SubscribableMachine<typeof machine>;
}
export type SubscribableMachine<
  M extends StateMachine<any, any> = StateMachine<any, any>,
> = M & {
  subscribe: Subscribe<ReturnType<M["getState"]>>;
  dispose: () => void;
};
