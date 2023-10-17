import {
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
  guard?: (context: T) => boolean;
  leave?: (context: T) => any;
  before?: (context: T) => any;
  enter?: (context: T) => any;
  handle?: (context: T) => T;
  after?: (context: T) => any;
};

export type TransitionHookMapping<StateTransitions, T> = {
  [State in keyof StateTransitions]?: {
    [Event in keyof StateTransitions[State]]?: TransitionHookExtensions<T>;
  } & {
    "*"?: TransitionHookExtensions<T>;
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
  config: TransitionHookMapping<TransitionConfig, Event>,
) {
  return onUpdate(machine, (commit, updater) => {
    commit((context) => {
      const { event, from } = context;
      const anyMapping = config as any;
      const extensions = (anyMapping["*"]?.[event as any] ??
        anyMapping[from?.state ?? ""]?.[
          event as any
        ]) as TransitionHookExtensions<Event>;
      if (extensions) {
        const { before, after, enter, leave } = extensions;
        leave?.(context);
        before?.(context);
        enter?.(context);
        context = updater(context);
        after?.(context);
      }
      return context;
    });

    // return t(ev);
  });
}
