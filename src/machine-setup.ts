import { Adapters, HookAdapters } from "./alt";
import { HasMethod, MethodOf, methodExtender } from "./ext";
import { tapMethod } from "./ext/methodware/tap-method";

// #region interceptors
// export const send = methodHook("send");
export const before = machineHook("before");
export const transition = machineHook("transition");
export const resolve = machineHook("resolve");
export const update = machineHook("update");
export const handle = machineHook("handle");

// #region effects
export const effect = machineHook("effect");
// export const leave = tapMethod("leave");
export const after = machineHook("after");

// const enter: <T extends HasMethod<"enter">>(fn: T["enter"]) => (target: T) => () => void
export const enter = machineHook("enter");

// const notify: (source: Effect<ChangeCommandEvent>) => (target: HasMethod<"notify">) => () => void
export const notify = machineHook("notify");


export const leave = machineHook('leave')
export const guard = machineHook('guard')

function machineHook<
K extends string & keyof Adapters,
>(
  key: K
) {
  return <T extends HasMethod<K>>(...config: Parameters<Adapters<Parameters<MethodOf<T,K>>[0]>[K]>) => (
    methodExtender<K>(key)(HookAdapters[key](...config))    
  ) as (target: T) => () => void;
}