import { extendMethod, iff } from "./ext";
import { disposers } from "./ext/setup";
import { Disposer } from "./ext/types";
import {
  AnyFactoryMachineEvent,
  FactoryMachine,
  FactoryMachineContext,
} from "./factory-machine";
import { StateEventHookConfig, TransitionHookConfig } from "./lifecycle-types";
import { HookAdapters } from "./machine-hooks";
import { matchesChangeEventKeys } from "./match-property-filters";
import { KeyedChangeEventFilter } from "./typeguards";

export function onLifecycle<FC extends FactoryMachineContext>(
  machine: FactoryMachine<FC>,
  config: StateEventHookConfig<FC>,
) {
  const d = [] as Disposer[];
  for (const key in config) {
    const stateKey = key === "*" ? undefined : key;
    const fromStateConfig = config[key as keyof typeof config];
    if (!fromStateConfig) {
      continue;
    }
    const { on, enter, leave } = fromStateConfig;
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
          eventConfig as StateEventHookConfig<FC>,
          d,
        );
      }
    }
  }
  return disposers(d);
}

function useFilteredEventConfigs<FC extends FactoryMachineContext>(
  machine: FactoryMachine<FC>,
  filter: KeyedChangeEventFilter<AnyFactoryMachineEvent<FC>>,
  config:
    | StateEventHookConfig<FC>
    | TransitionHookConfig<AnyFactoryMachineEvent<FC>>,
  d: Disposer[],
) {
  for (const phase in config) {
    const hook = config[phase as keyof typeof config];
    if (hook) {
      const hookHandler = (HookAdapters as typeof HookAdapters)[
        phase as keyof typeof HookAdapters
      ];
      d.push(
        extendMethod(
          machine,
          phase as keyof FactoryMachine<FC>,
          iff(
            (ev: AnyFactoryMachineEvent<FC>) => matchesChangeEventKeys(ev, filter as any),
            (hookHandler as any)?.(hook, machine) ?? hook,
          ) as any,
        ),
      );
    }
  }
  return d;
}
