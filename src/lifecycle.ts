import { KeyedChangeEventFilter, isKeyedChangeEvent } from "./typeguards";
import { AnyStatesFactory, FactoryMachine, TransitionConfig } from "./factory-machine";
import { StateEventHookConfig, TransitionHookConfig } from "./lifecycle-types";
import { extendMethod, iff } from "./ext";
import { Disposer, disposers } from "./ext/setup";
import { ChangeCommandEvent } from "./types";
import { Hooks } from './machine-setup'

export function onLifecycle<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
>(
  machine: FactoryMachine<States, Transitions>,
  config: StateEventHookConfig<Transitions, States>,
) {
  const d = [] as Disposer[]
  for (const key in config) {
    
    const stateKey = key === '*' ? undefined : key
    const fromStateConfig = config[key];
    if (!fromStateConfig) {
      continue;
    }
    const { on, enter, leave } = fromStateConfig;
    console.log({ enter, leave })
    // useFilteredEventConfigs(machine, { _:'state', from: stateKey}, stateConfig, d)
    if (enter) { useFilteredEventConfigs(machine, { to: stateKey}, {enter}, d) } 
    if (leave) { useFilteredEventConfigs(machine, { from: stateKey}, {leave}, d) }  
    if (on) {
      for (const onKey in on) {
    
        const eventKey = onKey === '*' ? undefined : onKey
        const eventConfig = on[onKey];        
        if (!eventConfig) {
          continue;
        }
        useFilteredEventConfigs(machine, { from: stateKey, type: eventKey }, eventConfig, d)        
    
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
  config: StateEventHookConfig<Transitions, States> | TransitionHookConfig<Transitions>,
  d: Disposer[]
) {  
  // console.log('useFilteredEventConfigs', { filter })
  for (const phase in config) {
    const hook = config[phase as any]
    if (hook) {
      const hookHandler = Hooks[phase as any]
      console.log('add hook', phase, filter)
      d.push(
        extendMethod(
          machine,
          phase as any,
          iff(
            (ev) => isKeyedChangeEvent(ev, filter), 
            hookHandler?.(hook) ?? hook
          ),
        ),
      );
    }
  }
  return d
}