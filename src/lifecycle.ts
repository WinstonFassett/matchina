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


type TransitionHookExtensions2<TIn, TOut>
 = {
  guard?: (context: TOut) => boolean;
  // leave?: (context: TIn) => any;
  before?: (context: TOut) => any;
  // enter?: (context: TOut) => any;
  handle?: (context: TOut) => TOut;
  after?: (context: TOut) => any;
};


export type TransitionHookMapping2<
States extends StateCreators<any>,
TransitionConfig extends StateTransitionsConfig<States>,
> = {
  [StateKey in keyof TransitionConfig & keyof States]?: {
    [Event in keyof TransitionConfig[StateKey]]?: 
    TransitionConfig[StateKey][Event] extends keyof States
      ? (
        TransitionHookExtensions2<
          MachineEvent<States,TransitionConfig, any, 
            any,
            ReturnType<States[keyof States]>
          >,
          MachineEvent<
            States, TransitionConfig, 
            Event, // should constrain params
            ReturnType<States[StateKey]>,
            ReturnType<States[TransitionConfig[StateKey][Event]]>,
            Parameters<States[TransitionConfig[StateKey][Event]]>
          >
        >
      )
      : never
  }
  //  & {
  //   "*"?: TransitionHookExtensions2<
  //     MachineEvent<States,TransitionConfig>,
  //     MachineEvent<States,TransitionConfig>
  //   >;
  // };
};


export default {};

export function onLifecycle<
  States extends StateCreators<any>,
  TransitionConfig extends StateTransitionsConfig<States>,
  Event extends MachineEvent<States, TransitionConfig> = MachineEvent<
    States,
    TransitionConfig
  >  
>(
  machine: MachineFromStateCreatorsAndTransitionsConfig<
    States,
    TransitionConfig,
    Event
  >,
  config: TransitionHookMapping2<States, TransitionConfig>,
) {
  return onUpdate(machine, (commit, updater) => {
    commit(current => {
      const updated = updater(current)
      const { to: currentState } = current;
      const { event, to: nextState } = updated
      const anyMapping = config as any;
      const extensions = (anyMapping["*"]?.[event as any] ??
        anyMapping[currentState?.state ?? ""]?.[
          event as any
        ]) as TransitionHookExtensions2<Event, Event>;
      if (extensions) {
        const { guard, before, after } = extensions;
        if (guard && !guard(current)) return current
        // leave?.(current);        
        before?.(updated);
        // enter?.(updated);
        commit(() => updated);
        after?.(updated);
      }
      return updated;
    })
  });
}
