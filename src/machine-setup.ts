import {
  abortableEventware,
} from "./ext/funcware/abortable";
import { AbortableEventHandler } from "./ext/types";
import { methodExtender } from "./ext/methodware/method-extender";
import { tapMethod } from "./ext/methodware/tap-method";
import { StateMachinery } from "./state-machine";
import { ChangeCommandEvent, Guard, Handle } from "./types";
import { methodEventHook, methodHook, methodMiddleware } from "./ext/func-event-middleware/func-event-middleware";

// #region interceptors
export const send = methodHook("send");
export const before = methodEventHook("before");
export const transition = methodEventHook("transition");
export const resolve = methodEventHook("resolve");
export const guard1 = methodHook("guard");
export const guard = <E extends ChangeCommandEvent>(
  fn: StateMachinery<E>["guard"],
) =>
  methodEventHook("guard")((
    ev, next    
  ) => {    
    console.log('guarding', ev)
    if (fn(ev)) {
      next(ev)
    }
  }
  );
export const handle = <E extends ChangeCommandEvent>(
  fn: StateMachinery<E>["handle"],
) =>
  methodHook("handle")<StateMachinery<E>>((ev, next) => {
    fn(...ev[0]);
    next(ev)
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
