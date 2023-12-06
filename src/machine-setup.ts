import { Adapters, HookAdapters } from "./alt";
import { HasMethod, MethodOf, methodExtender } from "./ext";

// #region interceptors
// export const send = methodHook("send");
export const before = machineHook("before");
export const transition = machineHook("transition");
export const resolve = machineHook("resolve");
export const guard = machineHook('guard')
export const update = machineHook("update");
export const handle = machineHook("handle");
//#endregion

// #region effects
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