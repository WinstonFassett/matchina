import { enhanceMethod, iff } from "./ext";
import { Disposer, disposers } from "./ext/setup";
import {
  FactoryMachine,
  FactoryMachineContext,
  FactoryMachineEvent,
} from "./factory-machine";
import {
  StateEventHookConfig,
  StateHookConfig,
} from "./factory-machine-lifecycle-types";
import { HookAdapters } from "./state-machine-hooks";
import { ChangeEventKeyFilter, matchChange } from "./match-change";

export function onLifecycle<FC extends FactoryMachineContext>(
  machine: FactoryMachine<FC>,
  config: StateHookConfig<FC>,
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
      useFilteredEventConfigs(
        machine,
        { to: stateKey } as any,
        { enter } as any,
        d,
      );
    }
    if (leave) {
      useFilteredEventConfigs(
        machine,
        { from: stateKey } as any,
        { leave } as any,
        d,
      );
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
          { from: stateKey, type: eventKey } as any,
          eventConfig as StateHookConfig<FC>,
          d,
        );
      }
    }
  }
  return disposers(d);
}

function useFilteredEventConfigs<FC extends FactoryMachineContext>(
  machine: FactoryMachine<FC>,
  filter: ChangeEventKeyFilter<FactoryMachineEvent<FC>>,
  config: StateEventHookConfig<FactoryMachineEvent<FC>> | StateHookConfig<FC>,
  d: Disposer[],
) {
  for (const phase in config) {
    const hook = config[phase as keyof typeof config];
    if (hook) {
      const hookHandler = (HookAdapters as typeof HookAdapters)[
        phase as keyof typeof HookAdapters
      ];
      d.push(
        enhanceMethod(
          machine,
          phase as keyof FactoryMachine<FC>,
          iff(
            (ev: FactoryMachineEvent<FC>) => matchChange(ev, filter as any),
            (hookHandler as any)?.(hook, machine) ?? hook,
          ) as any,
        ),
      );
    }
  }
  return d;
}
