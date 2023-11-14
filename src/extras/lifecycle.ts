import { composeMiddleware, enhanceMachine, listen, Middleware, runMiddleware, when } from "../dev/lifecycle-v2";
import {
  StateMachine,
  StateMachineEvent,
  StatesFactory,
  TransitionConfig,
  UpdateEnhancer,
} from "../machine-types";
import { Func } from "../types";
import {
  StateEventHookConfig,
  StateTransitionHooks,
  TransitionHookConfig
} from "./lifecycle-types";

type Dispose = () => void;

const LIFECYCLE = [
  'guard',
  'handle',  
  'leave',
  'before',
  'enter',
  'after',  
] as const

const CLEANUP_OFFSET = "_cleanup" as const;

function onPhase<E>(machine: StateMachine<any, any>, eventKey: string, listener: Middleware<E>) {
    const subject = machine as any
    if (!subject.$on  ) {
      subject.$on  = {};
      // enhance machine
      const unenhance = enhanceMachine(machine)(
        (event, next) => {
          let phaseEvent = event
          for (const phase of LIFECYCLE) {
            console.log('PHASE', phase)
            let ran = false
            dispatchware(subject, phase)(event, result => { 
              phaseEvent = result as any 
              ran = true
            })            
            if (!ran) { 
              console.log('BREAKING at', phase)
              phaseEvent = undefined as any
              break; 
            }
          }
          if (phaseEvent) next(phaseEvent)
        }
      )
      subject.$on[CLEANUP_OFFSET] = [() => {
        console.log('UNENHANCING')
        unenhance()
      }]
    }
    if (!subject.$on[eventKey]) {
      subject.$on [eventKey] = [];
    }  
    subject.$on [eventKey].push(listener);
    // Cleanup function to remove the listener
    return function cleanup() {
      let listeners = subject.$on [eventKey];
      let index = listeners.indexOf(listener);
      if (index !== -1) {
          listeners.splice(index, 1);
      }
      // If no more listeners for this phase, clean up
      if (listeners.length === 0) {
        delete subject.$on  [eventKey];
        let cleanupPhase = eventKey + CLEANUP_OFFSET;
        if (subject.$on [cleanupPhase]) {
          subject.$on [cleanupPhase]();
          delete subject.$on  [cleanupPhase];
        }
      }
      if (Object.keys(subject.$on ).length === 1 && subject.$on [CLEANUP_OFFSET]) {
        subject.$on [CLEANUP_OFFSET].forEach((fn: any) => fn());
        delete subject.$on ;
      }
    };
}

let mwid = 0
function runMiddleware<T>(middlewares: Middleware<T>[], initialValue: T, finalCallback: (finalValue: T) => void): void {
  let index = 0;
  const id = mwid++
  
  function run(currentIndex: number, currentValue: T) {
      console.log('runMiddleware', mwid, currentIndex, 'of', middlewares.length)
      console.group()
      if (currentIndex === middlewares.length) {
          finalCallback(currentValue);
          console.log('done runMiddleware', mwid)
          return;
      }

      middlewares[currentIndex](currentValue, newValue => run(currentIndex + 1, newValue ?? currentValue));
      console.groupEnd()
  }
  console.log('runMiddleware', mwid)
  console.group()
  run(index, initialValue);
  console.log('done', mwid)
  console.groupEnd()
}


const  dispatchware = <E>(subject: any, eventKey: string) => ((event, next) => {
  const listeners = (subject.$on && subject.$on [eventKey]) as Middleware<E>[] | undefined;
  if (listeners) {
    console.log('Dispatching')
    console.group()
    runMiddleware(listeners, event, next)
    console.groupEnd()
    console.log('Dispatched')
    return
  }
  next(event)
}) as Middleware<E>

export function onLifecycle<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory<any>,
>(
  machine: StateMachine<Transitions, States>,
  config: StateEventHookConfig<Transitions, States>,
) {
  
  return lifecycleware(machine, config)
}


const asArray = <T>(u: T): T[] => Array.isArray(u) ? u : [u]

function hookware <E>(
  hook: HookFunc<E> | HookFunc<E>[],    
): Middleware<E> {
  if (!Array.isArray(hook)) {
    return hook
  }
  return composeMiddleware(...hook)
}  

export function lifecycleware<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory<any>,
  E extends StateMachineEvent<Transitions, States>
>(
  machine: StateMachine<Transitions, States>,
  config: StateEventHookConfig<
    Transitions,
    States
  >,
) {
  for (const stateKey in config) {
    const fromStateConfig = config[stateKey]
    if (!fromStateConfig) continue;
    const { enter, leave } = fromStateConfig
   
    if (enter) {
      onPhase(machine, 'enter', hookware(enter as any))      
    }
    if (leave) {
      onPhase(machine, 'leave', hookware(leave as any))
    }
    const { on } = fromStateConfig
    if (on) {
      for (const eventKey in on) {
        const eventConfig = on[eventKey]
        if (!eventConfig) continue;
        for (const hookKey in eventConfig) {
          const hook = eventConfig[hookKey as never]
          if (hook) {
            onPhase(machine, hookKey, hookware(hook as any))
          }
        }
        (['guard', 'handle', 'before','after'] as const).forEach(phase => {
          const hook = eventConfig[phase]
          if (hook) {
            onPhase(machine, phase, hookware(hook as any))
          }
        })                
      }
    }
  }
}


type HookFunc<E> = (ev:E) => (void | E)