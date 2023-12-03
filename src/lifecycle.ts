import { KeyedChangeEventFilter, isKeyedChangeEvent } from "./typeguards";
import {
  AnyStatesFactory,
  FactoryMachine,
  TransitionConfig,
} from "./factory-machine";
import { StateEventHookConfig, TransitionHookConfig } from "./lifecycle-types";
import { extendMethod, iff } from "./ext";
import { Disposer, disposers } from "./ext/setup";
import { ChangeCommandEvent } from "./types";
import { Hooks } from "./machine-setup";

export function onLifecycle<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
>(
  machine: FactoryMachine<States, Transitions> ,
  config: StateEventHookConfig<Transitions, States>,
) {
  const d = [] as Disposer[];
  for (const key in config) {
    const stateKey = key === "*" ? undefined : key;
    const fromStateConfig = config[key as keyof typeof config];
    if (!fromStateConfig) {
      continue;
    }
    const { on, enter, leave } = fromStateConfig;
    console.log({ enter, leave });
    // useFilteredEventConfigs(machine, { _:'state', from: stateKey}, stateConfig, d)
    if (enter) {
      useFilteredEventConfigs(machine, { to: stateKey }, { enter } as any, d);
    }
    if (leave) {
      useFilteredEventConfigs(machine, { from: stateKey }, { leave } as any, d);
    }
    if (on) {
      for (const onKey in on) {
        const eventKey = onKey === "*" ? undefined : onKey;
        const eventConfig = on[onKey as keyof typeof on];
        if (!eventConfig) {
          continue;
        }
        useFilteredEventConfigs(
          machine,
          { from: stateKey, type: eventKey },
          eventConfig as StateEventHookConfig<Transitions, States>,
          d,
        );
      }
    }
  }
  return disposers(d);
}

function useFilteredEventConfigs<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
>(
  machine: FactoryMachine<States, Transitions>,
  filter: KeyedChangeEventFilter<ChangeCommandEvent>,
  config:
    | StateEventHookConfig<Transitions, States>
    | TransitionHookConfig<Transitions>,
  d: Disposer[],
) {
  // console.log('useFilteredEventConfigs', { filter })
  for (const phase in config) {
    const hook = config[phase as keyof typeof config];
    if (hook) {
      const hookHandler = (Hooks as typeof Hooks)[phase as keyof typeof Hooks];
      console.log("add hook", phase, filter);
      d.push(
        extendMethod(
          machine,
          phase as keyof FactoryMachine<States, Transitions>,
          iff(
            (ev: ChangeCommandEvent) => isKeyedChangeEvent(ev, filter),
            (hookHandler as any)?.(hook, machine) ?? hook,
          ) as any,
        ),
      );
    }
  }
  return d;
}
