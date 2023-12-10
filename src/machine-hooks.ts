import {
  AbortableEventHandler,
  Funcware,
  HasMethod,
  MethodOf,
  abortableEventware,
  functionTap,
  methodExtender,
} from "./ext";
import { StateMachineEvent, StateMachinery } from "./state-machine";
import { Effect, Middleware } from "./types";
import { Func } from "./utility-types";

// #region Adapters
export type Adapters<E extends StateMachineEvent = StateMachineEvent> = {
  [key: string]: Func;
} & {
  transition: (
    middleware: Middleware<E>,
  ) => Funcware<StateMachinery<E>["transition"]>;
  update: (middleware: Middleware<E>) => Funcware<StateMachinery<E>["update"]>;
  resolve: <F extends StateMachinery<E>["resolve"]>(
    resolveFn: F,
  ) => Funcware<F>;
  guard: (
    guardFn: StateMachinery<E>["guard"],
  ) => Funcware<StateMachinery<E>["guard"]>;
  handle: (
    handleFn: StateMachinery<E>["handle"],
  ) => Funcware<StateMachinery<E>["handle"]>;
  before: (abortware: AbortableEventHandler<E>) => Funcware<Transform<E>>;
  leave: Transform<Effect<E>, Funcware<Effect<E>>>;
  after: Transform<Effect<E>, Funcware<Effect<E>>>;
  enter: Transform<Effect<E>, Funcware<Effect<E>>>;
  effect: Transform<Effect<E>, Funcware<Effect<E>>>;
  notify: Transform<Effect<E>, Funcware<Effect<E>>>;
};
type Transform<I, O = I> = (source: I) => O;

export const HookAdapters = {
  transition: (middleware) => (next) => (ev) => {
    middleware(ev, next);
  },
  update: (middleware) => (next) => (ev) => {
    middleware(ev, next);
  },
  resolve: (resolveFn) => (next) => (ev) => resolveFn(ev) ?? next(ev),
  guard: (guardFn) => (inner) => combineGuards(inner, guardFn),
  handle: (handleFn) => (inner) => composeHandlers(handleFn, inner),
  before: (abortware) => abortableEventware(abortware),
  leave: functionTap,
  after: functionTap,
  enter: functionTap,
  effect: functionTap,
  notify: functionTap,
} as Adapters;
// #endregion

// #region Interceptors
// export const send = methodHook("send");
export const before = hookSetup("before");
export const transition = hookSetup("transition");
export const resolve = hookSetup("resolve");
export const guard = hookSetup("guard");
export const update = hookSetup("update");
export const handle = hookSetup("handle");
// #endregion

// #region Effects
export const effect = hookSetup("effect");
export const leave = hookSetup("leave");
export const enter = hookSetup("enter");
export const after = hookSetup("after");
export const notify = hookSetup("notify");
// #endregion

export const onBefore = machineHook("before");
export const onTransition = machineHook("transition");
export const onResolve = machineHook("resolve");
export const onGuard = machineHook("guard");
export const onUpdate = machineHook("update");
export const onHandle = machineHook("handle");
export const onEffect = machineHook("effect");
export const onLeave = machineHook("leave");
export const onEnter = machineHook("enter");
export const onAfter = machineHook("after");
export const onNotify = machineHook("notify");

function machineHook<K extends string & keyof Adapters>(key: K) {
  return <T extends HasMethod<K>>(machine: T, fn: MethodOf<T, K>) =>
    methodExtender<K>(key)(HookAdapters[key](fn))(machine);
}

function hookSetup<K extends string & keyof Adapters>(key: K) {
  return <T extends HasMethod<K>>(
    ...config: Parameters<Adapters<Parameters<MethodOf<T, K>>[0]>[K]>
  ) =>
    methodExtender<K>(key)(HookAdapters[key](...config)) as (
      target: T,
    ) => () => void;
}

function composeHandlers<E extends StateMachineEvent>(
  outer: (value: E) => E | undefined,
  inner: (value: E) => E | undefined,
): (value: E) => E | undefined {
  return (ev) => outer(inner(ev) as any);
}

function combineGuards<E extends StateMachineEvent>(
  first: (value: E) => boolean,
  next: (value: E) => boolean,
): (value: E) => boolean {
  return (ev) => {
    const res = first(ev) && next(ev);
    return res;
  };
}
