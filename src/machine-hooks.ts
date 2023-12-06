import { AbortableEventHandler, Funcware, HasMethod, MethodOf, abortableEventware, functionTap, methodExtender } from "./ext";
import { Resolver } from "./transition-machine";
import { ChangeCommandEvent, Effect, Guard, Handle, Middleware, Transitioner, Updater } from "./types";
import { Func } from "./utility-types";

//#region Adapters
export type Adapters<E extends ChangeCommandEvent = ChangeCommandEvent> = {
  [key: string]: Func;
} & {
  transition: (middleware: Middleware<E>) => Funcware<Transitioner<E>["transition"]>;
  update: (middleware: Middleware<E>) => Funcware<Updater<E>["update"]>;
  resolve: <F extends Resolver<E>["resolve"]>(resolveFn: F) => Funcware<F>;
  guard: (guardFn: Guard<E>) => Funcware<Guard<E>>;
  handle: (handleFn: Handle<E>) => Funcware<Handle<E>>;
  before: (abortware: AbortableEventHandler<E>) => Funcware<Transform<E>>;
  leave: Transform<Effect<E>, Funcware<Effect<E>>>;
  after: Transform<Effect<E>, Funcware<Effect<E>>>;
  enter: Transform<Effect<E>, Funcware<Effect<E>>>;
  effect: Transform<Effect<E>, Funcware<Effect<E>>>;
  notify: Transform<Effect<E>, Funcware<Effect<E>>>;
};
type Transform<I, O = I> = (source: I) => O;

export const HookAdapters = {
  transition: (middleware) => (next) => (ev) => { middleware(ev, next); },
  update: (middleware) => (next) => (ev) => { middleware(ev, next); },
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
//#endregion

// #region Interceptors
// export const send = methodHook("send");
export const before = machineHook("before");
export const transition = machineHook("transition");
export const resolve = machineHook("resolve");
export const guard = machineHook('guard')
export const update = machineHook("update");
export const handle = machineHook("handle");
//#endregion

// #region Effects
export const effect = machineHook("effect");
export const leave = machineHook('leave')
export const enter = machineHook("enter");
export const after = machineHook("after");
export const notify = machineHook("notify");
//#endregion

function machineHook<
K extends string & keyof Adapters,
>(
  key: K
) {
  return <T extends HasMethod<K>>(...config: Parameters<Adapters<Parameters<MethodOf<T,K>>[0]>[K]>) => (
    methodExtender<K>(key)(HookAdapters[key](...config))    
  ) as (target: T) => () => void;
}

function composeHandlers<E extends ChangeCommandEvent>(
  outer: (value: E) => E | undefined,
  inner: (value: E) => E | undefined
): (value: E) => E | undefined {
  return (ev) => outer(inner(ev) as any);
}

function combineGuards<E extends ChangeCommandEvent>(
  first: (value: E) => boolean,
  next: (value: E) => boolean
): (value: E) => boolean {
  return (ev) => {
    const res = first(ev) && next(ev);
    console.log("combined guards", res);
    return res;
  };
}
