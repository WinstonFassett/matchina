import {
  AnyStatesFactory,
  FlatEventKeys,
  StateEventTransitionFuncs,
  StateFromFactory,
  StateTransitionEvent,
  StateChangeMachineEvent,
  TransitionConfig,
  FlatExitStates,
  EventExitStatesIntersection,
  StateMachine,
  StateChangeMachineInternals,
  AnyMachineChangeEvent,
  extendHooks,
  withHooks,
  ensureHookInternals
} from "./machine-v2";
import { KeyedChangeEventFilter } from '../extras/typeguards'
import { Middleware, composeMiddleware, runMiddleware } from "../extras/middleware";
import { when } from "../extras/middleware/when";

type HookConfig<T> = {
  [K in keyof T]?: T[K] | T[K][];
};

export type TransitionHookExtensions<T> = {
  guard: Middleware<T>;
  before: Middleware<T>;
  handle: Middleware<T>;
  after: Middleware<T>;
};

export type TransitionHookConfig<T> = HookConfig<TransitionHookExtensions<T>>;

export type StateTransitionHooks<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
  StateKey extends keyof States | "*",
  Event extends StateTransitionEvent<Transitions, States> = StateTransitionEvent<Transitions, States>,
> = {
  leave: Middleware<
    StateChangeMachineEvent<
      Event['type'],
      Event['to'],
      StateFromFactory<States, StateKey>,
      Event['params']
    >
  >;
  enter: Middleware<
  StateChangeMachineEvent<
      Event['type'],
      StateFromFactory<States, StateKey>,
      Event['from'],
      Event['params']
    >
  >;
};

export type StateTransitionHookConfig<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
  StateKey extends keyof States | "*",
> = HookConfig<StateTransitionHooks<Transitions, States, StateKey>>;

type On<
  TC extends TransitionConfig<SF>,
  SF extends AnyStatesFactory,
  SK extends keyof TC | "*",
  E extends StateTransitionEvent<TC, SF> = StateTransitionEvent<TC, SF>, // HMM DUNNO
  EK extends E['type'] = E['type'],
> =
  // regular state
  SK extends keyof SF
    ? // specific state
      {
        [StateEventKey in
          | keyof TC[SK]
          | "*"]?: 
          StateEventKey extends EK //FlatEventKeys<E> // specific event
          ? ReturnType<
              StateEventTransitionFuncs<
                TC,
                SF
              >[SK][StateEventKey]
            > extends StateFromFactory<SF>
            ? TransitionHookConfig<
                StateChangeMachineEvent<
                  StateEventKey,
                  // StateFromFactory<SF>,
                  ReturnType<
                    StateEventTransitionFuncs<
                      TC,
                      SF
                    >[SK][StateEventKey]
                  >,
                  StateFromFactory<SF, SK>,
                  Parameters<
                    StateEventTransitionFuncs<
                      TC,
                      SF
                    >[SK][StateEventKey]
                  >
                >
              >
            : never
          : // wildcard event
            TransitionHookConfig<
              StateChangeMachineEvent<
                EK,
                StateFromFactory<SF>,
                StateFromFactory<SF, SK>,
                any[]
              >
            >;
      }
    : // wildcard state
      {
        [AnyStateEvent in
          | EK
          | "*"]?: TransitionHookConfig<

          StateChangeMachineEvent<
            AnyStateEvent extends '*' ? EK : AnyStateEvent,
            AnyStateEvent extends keyof EventExitStatesIntersection<TC,SF>
              ? EventExitStatesIntersection<TC,SF>[AnyStateEvent] extends StateFromFactory<SF>
                ? EventExitStatesIntersection<TC,SF>[AnyStateEvent]
                : StateFromFactory<SF>
              : StateFromFactory<SF>,
            StateFromFactory<SF,
              AnyStateEvent extends keyof TC[SK]
                ? Extract<SK, string>
                : Extract<keyof TC, string>
            >,
            any[]
          >
        >;
      };

export type StateEventHookConfig<
  TC extends TransitionConfig<SF>,
  SF extends AnyStatesFactory,
> = {
  [SK in keyof TC & keyof SF | "*"]?: {
    on?: On<TC, SF, SK>;
  } & StateTransitionHookConfig<TC, SF, SK>;
};

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




/*
Lifecycle needs a way to hook into specific phases.
This is v2 and our machine has the internals concept
of a phase. We can hook into that.
as middleware or as internals funcs though? hmm.
one is more primitive and can be used by the other, right?
which is it? hmm. I think the internals funcs are more primitive.
Yes I agree.
Let's go.
So we need some sort of lifecycle internals concept right?
*/

function lifecycleInternals <
  I extends StateChangeMachineInternals<any, any, any>,
>(inner: I, config: StateEventHookConfig<I['transitions'], I['states']>): I {


  return {
    ...inner,
    
  } 
}

/*
onPhase should
- take a phase and a middleware
- add that middleware to the phase
- return a function that removes the middleware from the phase

To add it to the phase it should register it
somewhere on the machine or better, on extended internals

*/

// type PhaseInternals = {
//   phases: {
//     [phase in keyof StateChangeMachineInternals<any, any, any, any>['phases']]: Middleware<any>[];
//   }

// }

type Phase = "guard" | "handle" | "enter" | "exit";
const Phases = ["guard", "handle", "enter", "exit"];
type PhaseInternals<E> = {
  phases: {
    // __init: () => void,
    [P in Phase]?: Middleware<E>[];
  } & {
    __cleanup: () => void;

  };
};

// to do this we need a machine with hooks, I think
// then we replace the hooks
// oh right but the idea here is we are getting the internals,
// not the machine itself
export function enhancePhase<E>(
  machineInternals: StateChangeMachineInternals<any, any, any>,
  phase: Phase,
  ...middlewares: Middleware<E>[]
): () => void {
  console.log('onPhase', phase)
  const internals = machineInternals as typeof machineInternals & PhaseInternals<E>;

  // const u = withHooks(internals, {
  //   [phase]: middlewares
  // })

  // requires hooks to be mounted and extendable
  // just call withHooks and let it handle this

  internals.phases ??= {} as any;
  if (!internals.phases.__cleanup) {
    const hookAdapters = {}
    for (const phase of Phases) {
      hookAdapters[phase] = (event, next) => {
        console.log('hook adapter', phase, event.to.key, internals.phases)
        const phaseHooks = internals.phases[phase] ?? [];
        // console.group()
        if (['enter', 'exit'].includes(phase)) {
          console.log(phase, phaseHooks.length, 'hooks')
          for (const hook of phaseHooks) {
            console.log('run', hook)
            hook(event, (x) => {
              // console.log('done', { x })
            });
          }
        } else {
          runMiddleware(phaseHooks, event, next);
        }
        // console.group()
        console.log(`/${phase}`)
      }
    }
    
    const u = withHooks(internals, hookAdapters)
    console.log('setup hook middleware')
    internals.phases.__cleanup = () => {
      u()
      console.log('cleaned up hook middleware')
    };
  }
  const phaseHooks = internals.phases[phase] ??= [];  
  phaseHooks.splice(phaseHooks.length, 0, ...middlewares);
  return () => {
    phaseHooks.splice(phaseHooks.indexOf(middlewares[0]), middlewares.length);
    if (internals.phases[phase]?.length === 0) {
      delete internals.phases[phase];
    }
  };
}

export function withLifecycle<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
>(
  machineInternals: StateChangeMachineInternals<any, any, any>,
  config: StateEventHookConfig<Transitions, States>,
) {
  for (const stateKey in config) {
    const fromStateConfig = config[stateKey];
    if (!fromStateConfig) {
      continue;
    }
    const { enter, leave } = fromStateConfig;

    if (enter) {
      enhancePhase(
        machineInternals,
        "enter",
        hookware(enter as any, { to: stateKey as any }),
      );
    }
    if (leave) {
      enhancePhase(
        machineInternals,
        "exit",
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
            console.log(`on ${phase} ${stateKey}=>${eventKey}`)
            enhancePhase(
              machineInternals,
              {
                after: "exit",
                before: "enter"
              }[phase] ?? phase,
              hookware(hook as any, {
                ['from']: stateKey as any,
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

function hookware<E>(
  hook: HookFunc<E> | HookFunc<E>[],
  filter: KeyedChangeEventFilter<E> = {},
): Middleware<E> {
  const runHook = Array.isArray(hook) ? composeMiddleware(...hook) : hook;

  // console.log('composing', hook.length)
  if (hook.length === 6) {
    throw new Error("wtf!!");
  }
  console.log({ filter })
  return when(filter)(runHook);
}
