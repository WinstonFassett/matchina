import { functionTap } from "../funcware/tap-function";
import { HasMethod } from "../types";
import { extendMethod } from "./extend-method";

export const tapMethod =
  <K extends string>(methodName: K) =>
  <T extends HasMethod<K>>(fn: T[K]) =>
  (target: T) => {
    return extendMethod(target, methodName, functionTap<K, T>(fn));
  };
