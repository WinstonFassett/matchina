---
title: "state-machine-hooks"
description: "Add description here"
---


```ts
import {
  HasMethod,
  MethodOf,
  abortable,
  tap,
  methodEnhancer,
  setup,
  enhanceMethod,
  Setup,
} from "./ext";
import { AbortableEventHandler } from "./ext/abortable";
import { Funcware } from "./ext/funcware/funcware";
import { ChangeEventKeyFilter, matchChange } from "./match-change";
import { HasFilterValues } from "./match-filters";
import { StateMachineEvent, StateMachine } from "./state-machine";
import { Effect, Middleware } from "./types";
import { Func } from "./utility-types";
```

```ts
export type Adapters<E extends StateMachineEvent = StateMachineEvent> = {
  [key: string]: Func;
} & {
  transition: (
    middleware: Middleware<E>,
  ) => Funcware<StateMachine<E>["transition"]>;
  update: (middleware: Middleware<E>) => Funcware<StateMachine<E>["update"]>;
  resolveExit: <F extends StateMachine<E>["resolveExit"]>(
    resolveFn: F,
  ) => Funcware<F>;
  guard: (
    guardFn: StateMachine<E>["guard"],
  ) => Funcware<StateMachine<E>["guard"]>;
  handle: (
    handleFn: StateMachine<E>["handle"],
  ) => Funcware<StateMachine<E>["handle"]>;
  before: (abortware: AbortableEventHandler<E>) => Funcware<Transform<E>>;
  leave: Transform<Effect<E>, Funcware<Effect<E>>>;
  after: Transform<Effect<E>, Funcware<Effect<E>>>;
  enter: Transform<Effect<E>, Funcware<Effect<E>>>;
  effect: Transform<Effect<E>, Funcware<Effect<E>>>;
  notify: Transform<Effect<E>, Funcware<Effect<E>>>;
};
type Transform<I, O = I> = (source: I) => O;

export const HookAdapters = {
  transition: middlewareToFuncware,
  update: middlewareToFuncware,
  resolveExit: (resolveFn) => (next) => (ev) => resolveFn(ev) ?? next(ev),
  guard: (guardFn) => (inner) => combineGuards(inner, guardFn),
  handle: (handleFn) => (inner) => composeHandlers(handleFn, inner),
  before: (abortware) => abortable(abortware),
  leave: tap,
  after: tap,
  enter: tap,
  effect: tap,
  notify: tap,
} as Adapters;
```

```ts
const machineHook =
  <K extends string & keyof Adapters>(key: K) =>
  <T extends HasMethod<K>>(machine: T, fn: MethodOf<T, K>) =>
    methodEnhancer<K>(key)(HookAdapters[key](fn))(machine);

const hookSetup =
  <K extends string & keyof Adapters>(key: K) =>
  <T extends HasMethod<K>>(
    ...config: Parameters<Adapters<Parameters<MethodOf<T, K>>[0]>[K]>
  ) =>
    methodEnhancer<K>(key)(HookAdapters[key](...config)) as (
      target: T,
    ) => () => void;

const composeHandlers =
  <E extends StateMachineEvent>(
    outer: (value: E) => E | undefined,
    inner: (value: E) => E | undefined,
  ): ((value: E) => E | undefined) =>
  (ev) =>
    outer(inner(ev) as any);

const combineGuards =
  <E extends StateMachineEvent>(
    first: (value: E) => boolean,
    next: (value: E) => boolean,
  ): ((value: E) => boolean) =>
  (ev) => {
    const res = first(ev) && next(ev);
    return res;
  };
```

```ts
// export const send = methodHook("send");
export const before = hookSetup("before");
export const transition = hookSetup("transition");
export const resolveExit = hookSetup("resolveExit");
export const guard = hookSetup("guard");
export const update = hookSetup("update");
export const handle = hookSetup("handle");
```

```ts
export const effect = hookSetup("effect");
export const leave = hookSetup("leave");
export const enter = hookSetup("enter");
export const after = hookSetup("after");
export const notify = hookSetup("notify");
```

```ts
export const onBefore = machineHook("before");
export const onTransition = machineHook("transition");
export const onResolveExit = machineHook("resolveExit");
export const onGuard = machineHook("guard");
export const onUpdate = machineHook("update");
export const onHandle = machineHook("handle");
export const onEffect = machineHook("effect");
export const onLeave = machineHook("leave");
export const onEnter = machineHook("enter");
export const onAfter = machineHook("after");
export const onNotify = machineHook("notify");

export const change = <
  E extends StateMachineEvent,
  F extends ChangeEventKeyFilter<E>,
  FE extends E & HasFilterValues<E, F>,
>(
  filter: F,
  ...setups: Setup<StateMachine<HasFilterValues<E, F>>>[]
) => {
  return (machine: StateMachine<E>) => {
    return enhanceMethod(machine, "transition", (next) => (ev) => {
      const unsetup = matchChange(ev, filter)
        ? setup(machine as unknown as StateMachine<FE>)(...setups)
        : undefined;
      const result = next(ev);
      unsetup?.();
      return result;
    });
  };
};

export const setupTransition = <
  E extends StateMachineEvent,
  F extends ChangeEventKeyFilter<E>,
>(
  machine: StateMachine<E>,
  filter: F,
  ...setups: Setup<StateMachine<HasFilterValues<E, F>>>[]
) => change(filter, ...setups)(machine);

function middlewareToFuncware<E>(
  middleware: Middleware<E>,
): Funcware<(change: E) => void> {
  return (next) => (ev) => {
    middleware(ev, next);
  };
}
```
