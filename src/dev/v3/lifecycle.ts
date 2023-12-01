import { KeyedChangeEventFilter, isKeyedChangeEvent } from "../../extras/typeguards";
import { AnyStatesFactory, FactoryMachine, TransitionConfig } from "./factory-machine";
import { StateEventHookConfig, TransitionHookConfig } from "./lifecycle-types";
import { methodExtend, whenware } from "./method";
import { Disposer, disposers } from "./setup";
import { ChangeCommandEvent } from "./types";

export function onLifecycle<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
>(
  machine: FactoryMachine<States, Transitions>,
  config: StateEventHookConfig<Transitions, States>,
) {
  const d = [] as Disposer[]
  console.log('onLifecycle', config)
  for (const stateKey in config) {
    console.log({ stateKey })
    const fromStateConfig = config[stateKey];
    if (!fromStateConfig) {
      continue;
    }
    useFilteredEventConfigs(machine, { from: stateKey}, ['enter', 'leave'], fromStateConfig, d)
    console.log('proceeding')
    const { on } = fromStateConfig;
    if (on) {
      for (const eventKey in on) {
        
        const eventConfig = on[eventKey];
        if (!eventConfig) {
          continue;
        }
        useFilteredEventConfigs(machine, { from: stateKey, type: eventKey }, ['guard', 'handle', 'before', 'after'], eventConfig, d)        
      
      }
    }
  }
  return disposers(d)
}

function useFilteredEventConfigs<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
>(
  machine: FactoryMachine<States, Transitions>,
  filter: KeyedChangeEventFilter<ChangeCommandEvent>,
  phases: (keyof StateEventHookConfig<Transitions, States>)[],
  config: StateEventHookConfig<Transitions, States> | TransitionHookConfig<Transitions>,
  d: Disposer[]
) {  
  console.log('useFilteredEventConfigs', { phases, filter, config })
  for (const phase of phases) {
    const hook = config[phase as any]
    if (hook) {
      console.log('hook', phase)
      d.push(methodExtend(machine, phase as any, whenware(ev => isKeyedChangeEvent(ev, filter), hook)))
    }
  }
  return d
}