import {
  MachineEvent,
  MachineFromStateCreatorsAndTransitionsConfig,
  StateTransitionsConfig,
} from "./machine-types";
import { onUpdate } from "./on-update";
import { StateCreators } from "./states";

type TransitionHookExtensions<T> = {
  guard?: (change: T) => boolean;
  before?: (change: T) => any;
  handle?: (change: T) => T | undefined;
  after?: (change: T) => any;
};

type StateHookExtensions<
  States extends StateCreators<any>,
  TransitionConfig extends StateTransitionsConfig<States>,
  TLeave extends ReturnType<States[keyof States]>,
  TEnter extends ReturnType<States[keyof States]>,
> = {
  leave?: (
    change: MachineEvent<States, TransitionConfig, any, TLeave, TEnter>,
  ) => any;
  enter?: (change: TEnter) => any;
};

export type TransitionHookMapping2<
  States extends StateCreators<any>,
  TransitionConfig extends StateTransitionsConfig<States>,
> = {
  [StateKey in keyof TransitionConfig]?: {
    on?: {
      [Event in keyof TransitionConfig[StateKey]]?: TransitionConfig[StateKey][Event] extends keyof States
        ? TransitionHookExtensions<
            MachineEvent<
              States,
              TransitionConfig,
              Event, // should constrain params
              ReturnType<States[StateKey]>,
              ReturnType<States[TransitionConfig[StateKey][Event]]>,
              Parameters<States[TransitionConfig[StateKey][Event]]>
            >
          >
        : never;
    };
  } & StateHookExtensions<
    States,
    TransitionConfig,
    ReturnType<States[StateKey]>,
    any
  >;
};

export default {};

export function onLifecycle<
  States extends StateCreators<any>,
  TransitionConfig extends StateTransitionsConfig<States>,
  Event extends MachineEvent<States, TransitionConfig> = MachineEvent<
    States,
    TransitionConfig
  >,
>(
  machine: MachineFromStateCreatorsAndTransitionsConfig<
    States,
    TransitionConfig,
    Event
  >,
  config: TransitionHookMapping2<States, TransitionConfig>,
) {
  return onUpdate(machine, (commit, updater) => {
    commit((current) => {
      const updated = updater(current);
      const { to: currentState } = current;
      const { event } = updated;
      const fromStateHooks = config[currentState.state as keyof typeof config];
      const fromStateEventHooks = fromStateHooks?.on;
      const currentEventHooks = fromStateEventHooks?.[event];
      const { handle, guard, before, after } = currentEventHooks || {};
      if (guard && !guard(updated as any)) {
        return current;
      }
      const handled = handle
        ? (handle(updated as any) as typeof updated) ?? current
        : updated;
      console.log({ handled });
      if (handled === current) {
        console.log("HANDLER REJECTED");
        return handled;
      }
      const { to } = handled;
      const toStateHooks = config[to.state as keyof typeof config];

      fromStateHooks?.leave?.(handled);
      before?.(handled as any);
      toStateHooks?.enter?.(handled);
      commit(() => handled);
      after?.(handled as any);
      return handled;
    });
  });
}
