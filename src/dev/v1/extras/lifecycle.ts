import {
  StateMachine,
  StatesFactory,
  TransitionConfig,
} from "../machine-types";
import { when } from "../middleware/when";
import { enhanceMachine } from "../middleware/enhance-machine";
import { composeMiddleware, runMiddleware } from "../middleware/middleware";
import { StateEventHookConfig } from "./lifecycle-types";
import {
  AnyKeyedChangeEvent,
  KeyedChangeEventFilter,
} from "../typeguards";
import { Middleware } from "../../../types";

const LIFECYCLE = [
  "guard",
  "handle",
  "leave",
  "before",
  "enter",
  "after",
] as const;

const CLEANUP_OFFSET = "_cleanup" as const;

export function onPhase<E>(
  machine: StateMachine<any, any>,
  eventKey: string,
  listener: Middleware<E>,
) {
  const subject = machine as any;
  if (!subject.$on) {
    subject.$on = {};
    // enhance machine
    const unenhance = enhanceMachine(machine)((event, next) => {
      let phaseEvent = event;
      // console.log('onPhase')
      // console.group()
      for (const phase of LIFECYCLE) {
        // console.log('PHASE', phase)
        // console.group()
        let ran = false;
        dispatchware(subject, phase)(event, (result) => {
          // console.log('inside dispatchware', phase, result.type)
          phaseEvent = result as any;
          ran = true;
        });
        // console.groupEnd()
        // console.log('DONE PHASE', phase)
        if (!ran) {
          console.log("BREAKING at", phase);
          phaseEvent = undefined as any;
          break;
        }
      }
      if (phaseEvent) {
        // console.log('NEXT', phaseEvent.type)
        // console.group()
        next(phaseEvent);
        // console.groupEnd()
        // console.log('DONE NEXT')
      }

      // console.groupEnd()
      // console.log('END onPhase')
    });
    subject.$on[CLEANUP_OFFSET] = [
      () => {
        console.log("UNENHANCING");
        unenhance();
      },
    ];
  }
  if (!subject.$on[eventKey]) {
    subject.$on[eventKey] = [];
  }
  subject.$on[eventKey].push(listener);
  // Cleanup function to remove the listener
  return function cleanup() {
    const listeners = subject.$on[eventKey];
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    // If no more listeners for this phase, clean up
    if (listeners.length === 0) {
      delete subject.$on[eventKey];
      const cleanupPhase = eventKey + CLEANUP_OFFSET;
      if (subject.$on[cleanupPhase]) {
        subject.$on[cleanupPhase]();
        delete subject.$on[cleanupPhase];
      }
    }
    if (Object.keys(subject.$on).length === 1 && subject.$on[CLEANUP_OFFSET]) {
      for (const fn of subject.$on[CLEANUP_OFFSET]) {
        fn();
      }
      delete subject.$on;
    }
  };
}

const mwid = 0;

let dispid = 0;
const dispatchware = <E>(subject: any, eventKey: string) =>
  ((event, next) => {
    const listeners = (subject.$on && subject.$on[eventKey]) as
      | Middleware<E>[]
      | undefined;
    if (listeners) {
      dispid++;
      // console.log('Dispatching', eventKey, dispid)
      // console.group()
      // composeMiddleware(...listeners)(event, next)
      runMiddleware(listeners, event, next);
      // console.groupEnd()
      // console.log('Dispatched', eventKey, dispid)
      return;
    }
    next(event);
  }) as Middleware<E>;

export function onLifecycle<
  Transitions extends TransitionConfig<States>,
  States extends StatesFactory<any>,
>(
  machine: StateMachine<Transitions, States>,
  config: StateEventHookConfig<Transitions, States>,
) {
  for (const stateKey in config) {
    const fromStateConfig = config[stateKey];
    if (!fromStateConfig) {
      continue;
    }
    const { enter, leave } = fromStateConfig;

    if (enter) {
      onPhase(
        machine,
        "enter",
        hookware(enter as any, { to: stateKey as any }),
      );
    }
    if (leave) {
      onPhase(
        machine,
        "leave",
        hookware(leave as any, { from: stateKey as any }),
      );
    }
    const { on } = fromStateConfig;
    if (on) {
      for (const eventKey in on) {
        const eventConfig = on[eventKey];
        if (!eventConfig) {
          continue;
        }
        for (const phase of ["guard", "handle", "before", "after"] as const) {
          const hook = eventConfig[phase];
          if (hook) {
            onPhase(
              machine,
              phase,
              hookware(hook as any, {
                from: stateKey as any,
                type: eventKey as any,
              }),
            );
          }
        }
      }
    }
  }
}

type HookFunc<E> = (ev: E) => void | E;

function hookware<E extends AnyKeyedChangeEvent>(
  hook: HookFunc<E> | HookFunc<E>[],
  filter: KeyedChangeEventFilter<E> = {},
): Middleware<E> {
  const runHook = Array.isArray(hook) ? composeMiddleware(...hook) : hook;

  // console.log('composing', hook.length)
  if (hook.length === 6) {
    throw new Error("wtf!!");
  }
  return when(filter)(runHook);
}
