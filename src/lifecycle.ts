import {
  MachineEvent,
  MachineFromStateCreatorsAndTransitionsConfig,
  StateTransitionsConfig,
} from "./machine-types";
import { onTransition } from "./on-transition";
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

export function transitionMiddleware<T extends TransitionEvent<any, any, any>>(
  mapping: TransitionHookMapping<any, T>,
) {
  return (context: T, next: (context: T) => T) => {
    const { event, from } = context;
    const anyMapping = mapping as any;
    const extensions = (anyMapping["*"]?.[event as any] ??
      anyMapping[from?.state ?? ""]?.[
        event as any
      ]) as TransitionHookExtensions<T>;
    if (extensions) {
      const { before, after, enter, leave } = extensions;
      leave?.(context);
      before?.(context);
      enter?.(context);
      context = next(context);
      after?.(context);
    }
    return context;
  };
}
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
  const middleware = transitionMiddleware<Event>(config);

  return onTransition(machine, (t, ev) => {
    return middleware(ev, (ret: any) => t(ret ?? ev));
    return t(ev);
  });
}
