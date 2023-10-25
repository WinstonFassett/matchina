import { StatesFactory } from "../states";
import { StateEventHookConfig, StateMachine, TransitionConfig } from "../types";
import { UpdateEnhancer, onUpdate } from "./on-update";

export function onLifecycle<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
>(
  machine: StateMachine<States, Transitions>,
  config: StateEventHookConfig<States, Transitions>,
) {
  return onUpdate(machine, lifecycle(config));
}

export function lifecycle<
  States extends StatesFactory<any>,
  Transitions extends TransitionConfig<States>,
>(
  config: StateEventHookConfig<States, Transitions>,
): UpdateEnhancer<StateMachine<States, Transitions>> {
  return (commit, updater) => {
    commit((current) => {
      const updated = updater(current);
      const { to: currentState } = current;
      const { type: event } = updated;
      const fromStateHooks = config[currentState.key as keyof typeof config];
      const fromStateEventHooks = fromStateHooks?.on;
      const currentEventHooks = fromStateEventHooks?.[event];
      const { handle, guard, before, after } = currentEventHooks || {};
      if (guard && !guard(updated as any)) {
        return current;
      }
      const handled = handle
        ? (handle(updated as any) as typeof updated) ?? current
        : updated;
      if (handled === current) {
        return handled;
      }
      const { to } = handled;
      const toStateHooks = config[to.key as keyof typeof config];

      fromStateHooks?.leave?.(handled as any); // todo: remove need for any
      before?.(handled as any);
      toStateHooks?.enter?.(handled as any);
      commit(() => handled);
      after?.(handled as any);
      return handled;
    });
  };
}
