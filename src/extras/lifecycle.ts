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
]

const CLEANUP_OFFSET = "_cleanup";

function on<E>(machine: StateMachine<any, any>, eventKey: string, listener: Middleware<E>) {
    const subject = machine as any
    if (!subject.$on  ) {
      subject.$on  = {};
      // enhance machine
      const unenhance = enhanceMachine(machine)(
        (event, next) => {
          let phaseEvent = event
          for (const phase of LIFECYCLE) {
            console.log('PHASE', phase)            
            dispatchware(subject, phase)(phaseEvent, nextEvent => { phaseEvent = nextEvent as any })
            if (!phaseEvent) { break; }
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

  function run(currentIndex: number, currentValue: T) {
      if (currentIndex === middlewares.length) {
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
    runMiddleware(listeners, event, next)    
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
  const use = enhanceMachine(machine)
  return use(lifecycleware(config))
}


const asArray = <T>(u: T): T[] => Array.isArray(u) ? u : [u]

export function lifecycleware<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory<any>,
  E extends StateMachineEvent<Transitions, States>
>(
  config: StateEventHookConfig<
    Transitions,
    States
  >,
): Middleware<E> {
  // 
}

export function lifecycleware1<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory<any>,
  E extends StateMachineEvent<Transitions, States>
>(
  config: StateEventHookConfig<
    Transitions,
    States
  >,
): Middleware<E> {
  
  const wares: Middleware<E> [] = []

  function hookware (
    hook: HookFunc<E> | HookFunc<E>[],    
  ): Middleware<E> {
    return (ev, next) => {      
      if (typeof hook ==='function') return hook(ev) ?? next(ev);
      return hook.reduceRight((e, fn) => {
        return fn(e) ?? e
      }, ev)
    }
  }
  
  for (const stateKey in config) {
    const fromStateConfig = config[stateKey]
    if (!fromStateConfig) continue;
    const { enter, leave } = fromStateConfig
   
    if (enter) {
      wares.push(
        when<E>({ 
          to: stateKey === '*' ? undefined : stateKey as any
        })(hookware(enter))
      )
    }
    if (leave) {
      wares.push(
        when<E>({ 
          from: stateKey === '*' ? undefined : stateKey as any
        })(
          (ev, next) => {
            console.log('leaveware before')
            console.group()
            next(ev)
            console.groupEnd()
            console.log('leaveware after')
          },
          hookware(leave)
        )
      )

    }
    
    const { on } = fromStateConfig
    if (on) {
      for (const eventKey in on) {
        const eventConfig = on[eventKey]
        const eventwares: Middleware<E>[] = []
        if (!eventConfig) continue;
        const { guard, handle, before, after } = eventConfig
        if (guard) {          
          eventwares.push(
            (ev, next) => { 
              if (asArray(guard).every(g => g(ev))) next(ev)
              else {
                console.log('guard failed', ev)
              }
            }
          )
        }
        if (handle) {  
          eventwares.push(
            (e,n) => {
              n(e)
              console.log('handled', e.type)
            },
            ...asArray(handle).map(h => {
              return ((ev, next) => {
                console.log('handle', ev.type)
                ev = h(ev)
                if (ev){
                  console.log('handler handled',ev.type)
                  next(ev)                
                }
              }) as Middleware<E>
            }))
        }
        if (before||after) {
          eventwares.push(
            listen((ev) => {     
              console.log('BEFORE', ev.type)         
              for (const fn of asArray(before)) {
                fn?.(ev)                
              }
              return () => {
                for (const fn of asArray(after)) {
                  fn?.(ev)                
                }
              }
            })
          )
        }
        if (eventwares.length>0) {
          wares.push(when<E>({ 
            from: stateKey === '*' ? undefined : stateKey as any,
            type: eventKey === '*' ? undefined : eventKey as any            
          })(...eventwares))
        }
      }
    }
  }
  console.log('count', wares.length)
  return composeMiddleware(
    (e, next) => {
      console.log('OUTER', e.type)
      console.group()
      next(e)
      console.groupEnd()
      console.log('OUTER DONE')
    },
    ...wares);
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