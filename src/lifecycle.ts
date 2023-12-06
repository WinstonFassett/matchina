import { KeyedChangeEventFilter, isKeyedChangeEvent } from "./typeguards";
import {
  AnyStatesFactory,
  FactoryMachine,
  TransitionConfig,
} from "./factory-machine";
import { StateEventHookConfig, TransitionHookConfig } from "./lifecycle-types";
import { abortableEventware, extendMethod, iff } from "./ext";
import { disposers } from "./ext/setup";
import { AbortableEventHandler, Disposer, Funcware } from "./ext/types";
import { ChangeCommandEvent, Effect, Guard, Handle, Middleware, Transitioner, Updater } from "./types";
import { combineGuards, composeHandlers } from "./machine-setup";
import { Resolver } from "./transition-machine";

export function onLifecycle<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
>(
  machine: FactoryMachine<States, Transitions>,
  config: StateEventHookConfig<Transitions, States>,
) {
  const d = [] as Disposer[];
  for (const key in config) {
    const stateKey = key === "*" ? undefined : key;
    const fromStateConfig = config[key as keyof typeof config];
    if (!fromStateConfig) {
      continue;
    }
    const { on, enter, leave } = fromStateConfig;
    if (enter) {
      useFilteredEventConfigs(machine, { to: stateKey }, { enter } as any, d);
    }
    if (leave) {
      useFilteredEventConfigs(machine, { from: stateKey }, { leave } as any, d);
    }
    if (on) {
      for (const onKey in on) {
        const eventKey = onKey === "*" ? undefined : onKey;
        const eventConfig = on[onKey as keyof typeof on];
        if (!eventConfig) {
          continue;
        }
        useFilteredEventConfigs(
          machine,
          { from: stateKey, type: eventKey },
          eventConfig as StateEventHookConfig<Transitions, States>,
          d,
        );
      }
    }
  }
  return disposers(d);
}

function useFilteredEventConfigs<
  Transitions extends TransitionConfig<States>,
  States extends AnyStatesFactory,
>(
  machine: FactoryMachine<States, Transitions>,
  filter: KeyedChangeEventFilter<ChangeCommandEvent>,
  config:
    | StateEventHookConfig<Transitions, States>
    | TransitionHookConfig<Transitions>,
  d: Disposer[],
) {
  for (const phase in config) {
    const hook = config[phase as keyof typeof config];
    if (hook) {
      const hookHandler = (HookAdapters as typeof HookAdapters)[phase as keyof typeof HookAdapters];
      console.log("add hook", phase, filter);
      d.push(
        extendMethod(
          machine,
          phase as keyof FactoryMachine<States, Transitions>,
          iff(
            (ev: ChangeCommandEvent) => isKeyedChangeEvent(filter, ev),
            (hookHandler as any)?.(hook, machine) ?? hook,
          ) as any,
        ),
      );
    }
  }
  return d;
}



type Transform<I, O = I> = (source: I) => O;

type Adapters<E extends ChangeCommandEvent = ChangeCommandEvent> = {
  transition: (middleware: Middleware<E>) => Funcware<Transitioner<E>["transition"]>
  update: (middleware: Middleware<E>) => Funcware<Updater<E>["update"]>;
  resolve: <F extends Resolver<E>["resolve"]>(resolveFn: F) => Funcware<F>;
  guard: (guardFn: Guard<E>) => Funcware<Guard<E>>;
  handle: (handleFn: Handle<E>) => Funcware<Handle<E>>;
  before: (abortware: AbortableEventHandler<E>) => Funcware<Transform<E>>;
  leave: Transform<Effect<E>, Funcware<Effect<E>>>;
  after: Transform<Effect<E>, Funcware<Effect<E>>>
  enter: Transform<Effect<E>, Funcware<Effect<E>>>
  effect: Transform<Effect<E>, Funcware<Effect<E>>>
  notify: Transform<Effect<E>, Funcware<Effect<E>>>
};

const HookAdapters = {
  transition: (middleware) => (next) => (ev) => { middleware(ev, next) }, 
  update: (middleware) => (next) => (ev) => { middleware(ev, next) },    
  resolve:(resolveFn) => (next) => (ev) => resolveFn(ev) ?? next(ev),
  guard: (guardFn) => (inner) => combineGuards(inner, guardFn),
  handle: (handleFn) => (inner) => composeHandlers(handleFn, inner),
  before: (abortware) => abortableEventware(abortware),
  leave: effectHook("leave"),
  after: effectHook("after"),
  enter: effectHook("enter"),
  effect: effectHook("effect"),
  notify: effectHook("notify"),
} as Adapters;

export function effectHook(name: string) {
  return <E, F extends (...args: any[]) => any>(
    handler: (...params: Parameters<F>) => void
  ) => (source: F) => (...args: Parameters<F>) => {
    source(...args);
    handler(...args);
  };
}