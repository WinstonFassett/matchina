import { Func } from "../../types";
import { AbortableEventware, abortableEventware, makeAbortable } from "./Abortware";
import {
  Funcware,
  methodTap,
  methodUse
} from "./method";
import { Setup } from "./setup";
import { StateMachinery } from "./state-machine";
import { ChangeCommandEvent } from "./types";

//#region interceptors
export const send = methodUse("send");
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
export const effect = methodTap("effect");
export const leave = methodTap("exit");
export const after = methodTap("after");
export const enter = methodTap("enter");
export const notify = methodTap("notify");


export const Hooks = {
  // send,
  before: abortware => abortableEventware(abortware),  //abortableEventware2(before, 'before'),
  transition,
  resolve,
  guard: guardFn => (inner) => combineGuards(inner, guardFn),
  handle: handleFn => (inner) => composeHandlers(handleFn, inner),
  effect,
  leave,
  after,
  enter,
  notify,
};


function composeHandlers<E extends ChangeCommandEvent>(outer: (value: E) => E, inner: (value: E) => E): (value: E) => E {
  return (ev) => outer(inner(ev));
}

function combineGuards<E extends ChangeCommandEvent>(first: (value: E) => boolean, next: (value: E) => boolean): (value: E) => boolean {
  return (ev) => {
    const res = first(ev) && next(ev);
    console.log('combined guards', res)
    return res
  };
}
//#endregion
