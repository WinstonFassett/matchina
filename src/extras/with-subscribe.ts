import { StateMachine, TransitionConfig } from "../machine-types";
import { MatchboxFromStatesFactory, StatesMatchboxFactory } from "../states";
import { Subscribe, nanosubscriber } from "./nanosubscriber";
import { onUpdate } from "./on-update";

export function withSubscribe<
  States extends StatesMatchboxFactory<any>,
  Transitions extends TransitionConfig<States>,
>(machine: StateMachine<States, Transitions>) {
  type M = typeof machine;
  type State = MatchboxFromStatesFactory<M["def"]["states"]>;
  const [subscribe, emit] = nanosubscriber<State>();
  const dispose = onUpdate(machine, (commit, updater) => {
    commit(updater);
    emit(machine.getState());
  });
  return Object.assign(machine, {
    subscribe,
    dispose,
  }) as SubscribableMachine<typeof machine>;
}
export type SubscribableMachine<
  M extends StateMachine<any, any> = StateMachine<any, any>,
> = M & {
  subscribe: Subscribe<ReturnType<M["getState"]>>;
  dispose: () => void;
};
