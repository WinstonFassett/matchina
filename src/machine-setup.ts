import { HookAdapters } from "./alt";
import { HasMethod, extendMethod } from "./ext";
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
export const effect = machineHook("effect");
// export const leave = tapMethod("leave");
export const leave = machineHook('leave')
export const after = machineHook("after");
export const enter = tapMethod("enter");
export const notify = machineHook("notify");



export const guard2 = machineHook('guard')


// <K extends string>(methodName: K) =>
// <T extends HasMethod<K>>(fn: T[K]) =>

function machineHook<  
  K extends keyof typeof HookAdapters,  
>(
  key: K,  
) {
  return (...config: Parameters<(typeof HookAdapters)[K]>) =>
    <T extends HasMethod<K>>(target: T) =>
      extendMethod(target, key, (HookAdapters[key] as any)(...config) as any);  
}