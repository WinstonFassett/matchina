import { composeMiddleware, enhanceMachine, listen, Middleware, when } from "../dev/lifecycle-v2";
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
            dispatchware(subject, phase)(phaseEvent, nextEvent => { 
              phaseEvent = nextEvent as any 
              ran = true
            })            
            if (!ran) { 
              console.log('BREAKING at', phase)
              break; 
            }
          }
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

function runMiddleware<T>(middlewares: Middleware<T>[], initialValue: T, finalCallback: (finalValue: T) => void): void {
  let index = 0;
  console.log('running middleware')
  function run(currentIndex: number, currentValue: T) {
      if (currentIndex === middlewares.length) {
          console.log('final', currentValue)
          finalCallback(currentValue);
          return;
      }

      let middleware = middlewares[currentIndex];
      middleware(currentValue, newValue => run(currentIndex + 1, newValue));
  }

  run(index, initialValue);
}

const  dispatchware = <E>(subject: any, eventKey: string) => ((event, next) => {
  const listeners = (subject.$on   && subject.$on [eventKey]) as Middleware<E>[] | undefined;
  if (listeners) {
    return runMiddleware(listeners, event, next)    
  }
  return next(event)
}) as Middleware<E>


export function onLifecycle1<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory<any>,
>(
  machine: StateMachine<Transitions, States>,
  config: StateEventHookConfig<Transitions, States>,
) {
  const originalUpdate = machine.update;
  const enhancer = lifecycle(config);
  machine.update = (updater) => {
    originalUpdate.call(machine, (current) => {
      let result: typeof current | undefined;
      enhancer((enhanced) => {
        result = enhanced(current);
      }, updater);
      return result ?? current;
    });
  };
  return () => {
    machine.update = originalUpdate;
  };
}

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
  // return (ev, next) => {
  //   if (typeof hook ==='function') {
  //     console.log('hook func')
  //     console.group()
  //     const res = hook(ev, next);
  //     console.log('hook func res', res)
  //     console.groupEnd()
  //     if (res) next(res)
  //     return
  //   }
  //   console.log('hookware')    
  //   console.group()
  //   const res =  hook.reduceRight((e, fn) => {
  //     return fn(e) ?? e
  //   }, ev)
  //   console.groupEnd()
  //   console.log('hookware res', res)
  //   next(res)
  // }
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


export function lifecycle<M extends StateMachine<any, any>>(
  config: StateEventHookConfig<
    M["context"]["states"],
    M["context"]["transitions"]
  >,
): UpdateEnhancer<
  StateMachineEvent<M["context"]["states"], M["context"]["transitions"]>
> {
  const after: undefined | Func<[], void> = undefined;
  return (commit, updater) => {
    commit((current) => {
      const updated = updater(current);
      const { to: currentState } = current;
      const { type: event } = updated;
      const globalStateHooks = config["*"];
      const currentStateHooks = config[currentState.key as keyof typeof config];
      const currentStateCurrentEventHooks =
        currentStateHooks?.on?.[
          event as keyof (typeof currentStateHooks)["on"]
        ];

      const eventHooksMaybe: (undefined | TransitionHookConfig<any>)[] = [
        globalStateHooks?.on?.["*"],
        globalStateHooks?.on?.[event as keyof (typeof globalStateHooks)["on"]],
        currentStateHooks?.on?.["*"],
        currentStateCurrentEventHooks,
      ];
      // GUARD
      if (
        eventHooksMaybe.some(
          (hooks) => hooks?.guard && !runHook(hooks.guard, updated as any),
        )
      ) {
        return current;
      }
      // HANDLE
      const handle = currentStateCurrentEventHooks?.handle;
      const handled = handle
        ? (runHook(handle as any, updated as any) as typeof updated) ?? current
        : updated;
      if (handled === current) {
        return handled;
      }
      const nextStateHooks = config[handled.to.key as keyof typeof config];
      const runStateHooks = (
        stateHooksMaybe: StateTransitionHooks<
          M["context"]["states"],
          M["context"]["transitions"],
          any
        >[],
        hookName: keyof StateTransitionHooks<any, any, any>,
      ) => {
        for (const hooks of stateHooksMaybe) {
          hooks?.[hookName]?.(handled as any);
        }
      };
      const runEventHooks = (
        hookName: keyof TransitionHookConfig<any>,
      ) => {
        for (const hooks of eventHooksMaybe) {
          const hook = hooks?.[hookName]
          runHook(hook, handled)
          
        }
      };
      // LEAVE, BEFORE, ENTER, COMMIT, AFTER
      runStateHooks([currentStateHooks, globalStateHooks] as any, "leave");
      runEventHooks("before");
      runStateHooks([globalStateHooks, nextStateHooks] as any, "enter");
      // commit(() => handled);
      // implicitly the commit/change happens here
      // but we still run after hooks before returning
      // maybe that's not semantically correct. lets move it out maybe
      eventHooksMaybe.reverse();
      Promise.resolve().then(() => {
        runEventHooks("after");
      });
      return handled;
    });
  };
}
function runHook<E>(hook: undefined | HookFunc<E> | HookFunc<E>[], event: E) {
  if(!hook) return
  if (typeof hook ==='function') return hook(event);
  return hook.reduceRight((e, fn) => {
    return fn(e) ?? e
  }, event)
}

type HookFunc<E> = (ev:E) => (void | E)