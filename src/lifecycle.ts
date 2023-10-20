import {
  ExtractedEventParameters,
  MachineEvent,
  MachineFromStateCreatorsAndTransitionsConfig,
  StateTransitionsConfig,
} from "./machine-types";
import { onTransition } from "./on-transition";
import { onUpdate } from "./on-update";
import { StateCreators } from "./states";
import { TransitionEvent } from "./types";

export const LifecycleSymbol = Symbol("lifecycle");

type TransitionHookExtensions<T> = {
  guard?: (change: T) => boolean;
  before?: (change: T) => any;
  handle?: (change: T) => T;
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
  > & {
      "*"?: TransitionHookExtensions<MachineEvent<States, TransitionConfig>>;
    };
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
      const { event, to: nextState } = updated;
      const stateHooks =
        config[currentState.state as keyof typeof config] ??
        config["*" as keyof typeof config];
      const stateEventHooks = stateHooks?.on;
      const currentEventHooks =
        stateEventHooks?.[event] ?? stateEventHooks?.["*"];
      const { handle, guard, before, after } = currentEventHooks || {};
      if (guard && !guard(updated as any)) {
        return current;
      }
      const handled = (handle?.(updated as any) as typeof updated) ?? updated;
      stateHooks?.leave?.(handled);
      before?.(handled as any);
      stateHooks?.enter?.(handled);
      commit(() => handled);
      after?.(handled as any);
      return handled;
    });
  });
}
