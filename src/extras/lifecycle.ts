import { composeMiddleware, enhanceMachine, listen, Middleware, when } from "../dev/lifecycle-v2";
import {
  StateMachine,
  StateMachineEvent,
  TransitionConfig,
  UpdateEnhancer,
  StatesFactory,
} from "../machine-types";
import { Func } from "../types";
import {  
  StateEventHookConfig,
  StateTransitionHooks,
  TransitionHookConfig,
  TransitionHookExtensions,
} from "./lifecycle-types";

type Dispose = () => void;


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


const asArray = <T>(u: T) => Array.isArray(u) ? u : [u]

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
  
  const wares: Middleware<E> [] = []
  for (const fromKey in config) {
    const fromStateConfig = config[fromKey]
    if (!fromStateConfig) continue;
    const { enter, leave } = fromStateConfig
    if (enter || leave) {
      wares.push(when<E>({ 
        from: fromKey === '*' ? undefined : fromKey as any,        
      })(
        ((ev, next) => {          
          for (const fn of asArray(enter)) {
            fn?.(ev)                
          }
          next(ev)
          return () => {
            for (const fn of asArray(leave)) {
              fn?.(ev)                
            }
          }
        })
      ))
    }
    const { on } = fromStateConfig
    if (on) {
      for (const eventKey in on) {
        const eventConfig = on[eventKey]
        const eventwares: Middleware<E>[] = []
        if (!eventConfig) continue;
        const { guard, handle, before, after } = eventConfig
        if (guard) {
          eventwares.push(when<E>({ 
            from: fromKey === '*' ? undefined : fromKey as any,
            type: eventKey === '*' ? undefined : eventKey as any            
          })(
            (ev, next) => { 
              if (asArray(guard).every(g => g(ev))) next(ev)
            }
          ))          
        }
        if (handle) {  
          // need to splice
          wares.push(...asArray(handle))
        }
        if (before||after) {
          eventwares.push(
            listen((ev) => {              
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
            from: fromKey === '*' ? undefined : fromKey as any,
            type: eventKey === '*' ? undefined : eventKey as any            
          })(...eventwares))
        }
      }
    }
  }
  return composeMiddleware(...wares);
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