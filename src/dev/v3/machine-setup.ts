import {
  methodListenTo,
  methodUse
} from "./method";
import { StateMachinery } from "./state-machine";
import { ChangeCommandEvent } from "./types";

//#region interceptors
export const send = methodUse("send");
export const begin = methodUse("begin");
export const before = methodUse("before");
export const transition = methodUse("transition");
export const resolve = methodUse("resolve");
export const guard = <E extends ChangeCommandEvent>(
  fn: StateMachinery<E>["guard"],
) => methodUse("guard")<StateMachinery<E>>((inner) => combineGuards<E>(inner, fn));
export const handle = <E extends ChangeCommandEvent>(
  outer: StateMachinery<E>["handle"],
) => methodUse("handle")<StateMachinery<E>>((inner) => composeHandlers<E>(outer, inner));
//#endregion

//#region effects
export const effect = methodListenTo("effect");
export const leave = methodListenTo("exit");
export const enter = methodListenTo("enter");
export const notify = methodListenTo("notify");
export const end = methodListenTo("end");

function composeHandlers<E extends ChangeCommandEvent>(outer: (value: E) => E, inner: (value: E) => E): (value: E) => E {
  return (ev) => outer(inner(ev));
}

function combineGuards<E extends ChangeCommandEvent>(first: (value: E) => boolean, next: (value: E) => boolean): (value: E) => boolean {
  return (ev) => {
    return first(ev) && next(ev);
  };
}
//#endregion
