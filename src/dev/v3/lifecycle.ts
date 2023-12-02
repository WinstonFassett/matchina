import { KeyedChangeEventFilter, isKeyedChangeEvent } from "../../extras/typeguards";
import { AnyStatesFactory, FactoryMachine, TransitionConfig } from "./factory-machine";
import { StateEventHookConfig, TransitionHookConfig } from "./lifecycle-types";
import { methodExtend, whenware } from "./method";
import { Disposer, disposers } from "./setup";
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
    // console.log({ stateKey })
    const fromStateConfig = config[key];
    if (!fromStateConfig) {
      continue;
    }
    const { on, ...stateConfig } = fromStateConfig;
    useFilteredEventConfigs(machine, { from: stateKey}, stateConfig, d)
    // console.log('proceeding')
    
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
  // phases: (keyof StateEventHookConfig<Transitions, States>)[],
  config: StateEventHookConfig<Transitions, States> | TransitionHookConfig<Transitions>,
  d: Disposer[]
) {  
  // console.log('useFilteredEventConfigs', { filter, config })


  for (const phase in config) {
    const hook = config[phase as any]
    if (hook) {
      const hookHandler = Hooks[phase as any]
      // take hook and wrap with funcware handler
      // wrap funcware handler with whenware
      // apply to machine using methodExtend
      // const hookFunc = hookHandler?.(hook) //(machine)
      console.log('add hook', phase, hookHandler)
      d.push(
        // hookHandler ?
        // hookHandler(hook)(machine)
        // methodExtend(machine, phase as any, whenware((ev) => isKeyedChangeEvent(ev, filter), (inner => {
        //   console.log('inner', { phase, inner})
        //   return (...params: any ) => {
        //     console.log('hookfunc', params)
        //     return hookFunc(inner)(...params)
        //   }

        // })))
        // :
        methodExtend(
          machine,
          phase as any,
          whenware(
            (ev) => isKeyedChangeEvent(ev, filter), 
            hookHandler?.(hook) ?? hook
          ),
        ),
      );
    }
  }
  return d
}