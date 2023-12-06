import { methodEventHook, methodHook } from "./ext/func-event-middleware/func-event-middleware";
import { tapMethod } from "./ext/methodware/tap-method";
import { StateMachinery } from "./state-machine";
import { ChangeCommandEvent } from "./types";

// #region interceptors
// export const send = methodHook("send");
export const before = methodEventHook("before");
export const transition = methodEventHook("transition");
export const resolve = methodEventHook("resolve");
export const update = methodEventHook("update");

export const guard = <E extends ChangeCommandEvent>(
  fn: StateMachinery<E>["guard"],
) => methodEventHook("guard")((ev, next) => fn(ev) && next(ev));

export const handle = <E extends ChangeCommandEvent>(
  fn: StateMachinery<E>["handle"],
) =>
  methodEventHook("handle")<StateMachinery<E>>((ev, next) => {
    const handled = fn(ev);
    if (handled) { next(handled) }
  })
// #endregion

// #region effects
export const effect = tapMethod("effect");
export const leave = tapMethod("leave");
export const after = tapMethod("after");
export const enter = tapMethod("enter");
export const notify = tapMethod("notify");

// #endregion

export function composeHandlers<E extends ChangeCommandEvent>(
  outer: (value: E) => E | undefined,
  inner: (value: E) => E | undefined,
): (value: E) => E | undefined {
  return (ev) => outer(inner(ev) as any);
}

export function combineGuards<E extends ChangeCommandEvent>(
  first: (value: E) => boolean,
  next: (value: E) => boolean,
): (value: E) => boolean {
  return (ev) => {
    const res = first(ev) && next(ev);
    console.log("combined guards", res);
    return res;
  };
}
