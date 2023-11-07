import {
  StateFromFactory,
  StateMachine,
  StatesFactory,
  TransitionConfig,
} from "../machine-types";
import { nanosubscriber } from "./nanosubscriber";
import { onUpdate } from "./on-update";

export function withSubscribe<
  M extends StateMachine<StatesFactory, TransitionConfig<StatesFactory>>,
>(machine: M) {
  type State = StateFromFactory<M["def"]["states"]>;
  const [subscribe, emit] = nanosubscriber<State>();
  machine.update((previous) => previous);
  const dispose = onUpdate(machine, ((commit: any, updater: any) => {
    commit(updater);
    emit(machine.getState());
  }) as any);
  return Object.assign(machine, {
    subscribe,
    dispose,
  });
}
