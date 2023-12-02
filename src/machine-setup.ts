import { AbortableEventware, abortableEventware } from "./ext/funcware/abortable";
import { methodExtender } from "./ext/methodware/method-extender";
import { tapMethod } from "./ext/methodware/tap-method";
import { StateMachinery } from "./state-machine";
import { ChangeCommandEvent, Effect, Guard, Handle } from "./types";

// #region interceptors
export const send = methodExtender("send");
export const before = methodExtender("before");
export const transition = methodExtender("transition");
export const resolve = methodExtender("resolve");
export const guard = <E extends ChangeCommandEvent>(
  fn: StateMachinery<E>["guard"],
) =>
  methodExtender("guard")<StateMachinery<E>>((inner) =>
    combineGuards<E>(inner, fn),
  );
export const handle = <E extends ChangeCommandEvent>(
  outer: StateMachinery<E>["handle"],
) =>
  methodExtender("handle")<StateMachinery<E>>((inner) =>
    composeHandlers<E>(outer, inner),
  );
// #endregion

// #region effects
export const effect = tapMethod("effect");
export const leave = tapMethod("leave");
export const after = tapMethod("after");
export const enter = tapMethod("enter");
export const notify = tapMethod("notify");

const effectHook =
  (name: string) =>
  <E, F extends (...args: any[]) => any>(handler: (...params: Parameters<F>) => void) =>
  (inner: F) =>
  (...args: Parameters<F>) => {
    console.log("EFFECT", name);
    inner(...args);
    handler(...args);
  };
// #endregion

export const Hooks = {
  // send,
  transition,
  resolve,
  guard: <T extends ChangeCommandEvent>(guardFn: Guard<T>) => (inner: Guard<T>) => combineGuards<T>(inner, guardFn),
  handle: <E extends ChangeCommandEvent>(handleFn: Handle<E>) => (inner: Handle<E>) => composeHandlers(handleFn as Handle<E>, inner),
  before: <E>(abortware: AbortableEventware<E>) => abortableEventware(abortware), // abortableEventware2(before, 'before'),
  leave: effectHook("leave"),
  after: effectHook("after"),
  enter: effectHook("enter"),
  effect: effectHook("effect"),
  notify: effectHook("notify"),
};

function composeHandlers<E extends ChangeCommandEvent>(
  outer: (value: E) => E | undefined,
  inner: (value: E) => E | undefined,
): (value: E) => E | undefined {
  return (ev) => outer(inner(ev) as any);
}

function combineGuards<E extends ChangeCommandEvent>(
  first: (value: E) => boolean,
  next: (value: E) => boolean,
): (value: E) => boolean {
  return (ev) => {
    const res = first(ev) && next(ev);
    console.log("combined guards", res);
    return res;
  };
}
