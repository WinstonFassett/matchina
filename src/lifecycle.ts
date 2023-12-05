import { KeyedChangeEventFilter, isKeyedChangeEvent } from "./typeguards";
import {
  AnyStatesFactory,
  FactoryMachine,
  TransitionConfig,
} from "./factory-machine";
import { StateEventHookConfig, TransitionHookConfig } from "./lifecycle-types";
import { abortableEventware, extendMethod, iff } from "./ext";
import { disposers } from "./ext/setup";
import { AbortableEventHandler, Disposer } from "./ext/types";
import { ChangeCommandEvent, Guard, Handle } from "./types";
import { combineGuards, composeHandlers } from "./machine-setup";

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
    console.log({ enter, leave });
    // useFilteredEventConfigs(machine, { _:'state', from: stateKey}, stateConfig, d)
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
  // console.log('useFilteredEventConfigs', { filter })
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
}// #endregion

export const effectHook = (name: string) => <E, F extends (...args: any[]) => any>(
  handler: (...params: Parameters<F>) => void
) => (inner: F) => (...args: Parameters<F>) => {
  console.log("EFFECT", name);
  inner(...args);
  handler(...args);
};


const HookAdapters = {
  // send,
  // transition,
  // resolve,
  guard: <T extends ChangeCommandEvent>(guardFn: Guard<T>) => (inner: Guard<T>) => combineGuards<T>(inner, guardFn),
  handle: <E extends ChangeCommandEvent>(handleFn: Handle<E>) => (inner: Handle<E>) => composeHandlers(handleFn as Handle<E>, inner),
  before: <E>(abortware: AbortableEventHandler<E>) => abortableEventware(abortware),
  leave: effectHook("leave"),
  after: effectHook("after"),
  enter: effectHook("enter"),
  effect: effectHook("effect"),
  notify: effectHook("notify"),
};