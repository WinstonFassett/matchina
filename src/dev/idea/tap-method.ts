import { tap } from "../../ext/funcware/tap";
import { HasMethod } from "../../ext/types";
import { extendMethod } from "../../ext/methodware/extend-method";

export const tapMethod =
  <K extends string>(methodName: K) =>
  <T extends HasMethod<K>>(fn: T[K]) =>
  (target: T) => {
    return extendMethod(target, methodName, tap<K, T>(fn));
  };
