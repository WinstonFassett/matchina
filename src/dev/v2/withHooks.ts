import { AnyMachineChangeEvent, CreateStateChangeMachineProps, StateMachineHooks, HasHooks, HooksMarker } from "./machine-types-v2";
import { defaultInternals, createResolver } from "./machine-v2";

// export function internalsToHooks<
//   States extends AnyStatesFactory,
//   S extends StateFromFactory<States>,
//   Event extends ChangeMachineEvent<any, S, S, any>,
//   TC extends TransitionConfig<States>
// >(
//   internals: StateChangeMachineInternals<TC, States, Event>,
// ): StateMachineHooks<Event> {
//   return {
//     resolve: (event, next) => { next(internals.resolve(event) as any) },      
//     guard: (event, next) => { if (internals.guard(event)) next(event) },
//     handle: (event, next) => { next(internals.handle(event)) },
//     exit: (event) => { internals.exit(event); },
//     enter: (event) => { internals.enter(event); },    
//   };
// }


export function withHooks<
  Options extends CreateStateChangeMachineProps<any>,
  E extends AnyMachineChangeEvent
>(
  options: Options & Partial<HasHooks<E>>,
  hooks: StateMachineHooks<E>
) {

  // check if hooks present
  ensureHookInternals(options);
  if (options.hooks) {
    console.log('Extending hooks');
    return extendHooks(options.hooks, hooks);
  }

  // first time to add hooks to this context
  else {
    console.log('adding hooks registry');
    options.hooks = hooks;
    return () => {
      delete options.hooks;
    };
  }
}

export function extendHooks<E extends AnyMachineChangeEvent>(
  innerHooks: StateMachineHooks<E>,
  newHooks: StateMachineHooks<E>) {
  // return Object.assign(innerHooks, newHooks)
  const originals = {} as StateMachineHooks<E>;
  for (const key in newHooks) {
    const hook = newHooks[key];
    const original = innerHooks[key];
    if (original) {
      innerHooks[key] = (event, next) => {
        original(event, (nextEvent) => {
          hook(nextEvent ?? event, next);
        });
      };
      originals[key] = original;
    } else {
      innerHooks[key] = hook;
    }
  }
  return () => {
    for (const key in originals) {
      innerHooks[key] = originals[key];
    }
  };
}
/**
 * Adapts internals to support hook arrays
 * Registered on internals at hooks.internals
 * This should only be needed once per internals
 * @param baseInternals
 * @param hooks
 * @returns
 */


export function ensureHookInternals<
  Options extends CreateStateChangeMachineProps<any>,
  E extends AnyMachineChangeEvent
>(
  baseInternals = {} as Options, hooks: StateMachineHooks<E> = {}) {
  if (baseInternals[HooksMarker]) return;
  const originals = { ...baseInternals };

  const internals = Object.assign(baseInternals, {
    [HooksMarker]: true,
    hooks,
    // resolve: undefined as any,
    guard: (event) => {
      const innerGuard = (originals.guard ?? defaultInternals.guard);
      if (hooks.guard) {
        let guardResult = false;
        let guardRan = false;
        hooks.guard(event, (nextEvent) => {
          if (nextEvent) {
            guardResult = innerGuard(nextEvent ?? event);
            console.log('guard ran', guardResult);
            guardRan = true;
          } else {
            console.log('guard skipped');
          }
        });
        if (!guardRan) {
          console.log('guard was short-circuited');
        }
        if (!guardResult) return false;
        console.log('GUARD PASSED');
        return true;
      } else {
        console.log('guard without hook');
        return innerGuard(event);
      }
    },
    handle: (event) => {
      let result: E | undefined = undefined;
      let handle = originals.handle ?? defaultInternals.handle;
      runThruHooks(
        internals.hooks?.handle,
        event,
        ev => {
          if (ev) {
            result = handle(ev);
          }
        }
      );
      // internals.hooks?.handle?.(
      //   event,
      //   (nextEvent) => (result = nextEvent && handle(nextEvent)),
      // );
      if (result) {
        return result;
      }
    },
    enter: (event) => {
      (originals.enter ?? defaultInternals.enter)(event);
      internals.hooks?.enter?.(event);
    },
    exit: (event) => {
      (originals.exit ?? defaultInternals.exit)(event);
      internals.hooks?.exit?.(event);
    },
  });


  internals.resolve ??= createResolver(internals as any);

  return internals;
}
function runThruHooks(
  hook: any,
  event: any,
  original?: ((event: any) => void) | undefined
) {
  if (hook) {
    hook(event, original);
  } else {
    original?.(event);
  }
}
