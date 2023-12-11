import { functionTap } from "../../ext/funcware/tap-function";
import { HasMethod } from "../../ext/types";
import { extendMethod } from "../../ext/methodware/extend-method";

export const tapMethod =
  <K extends string>(methodName: K) =>
  <T extends HasMethod<K>>(fn: T[K]) =>
  (target: T) => {
    return extendMethod(target, methodName, functionTap<K, T>(fn));
  };
