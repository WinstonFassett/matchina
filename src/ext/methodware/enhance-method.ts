import { Funcware } from "../../function-types";
import {
  EnhancedFunc,
  enhanceFunction,
  isEnhancedFunction,
} from "./enhance-function";
import type { MethodOf } from "../../";

const noop = () => {};

export function enhanceMethod<T, K extends keyof T>(
  target: T,
  methodName: K,
  extend: Funcware<MethodOf<T, K>>
) {
  const current = target[methodName] as MethodOf<T, K>;
  let enhanced: EnhancedFunc<MethodOf<T, K>>;
  if (isEnhancedFunction(current)) {
    enhanced = current;
  } else {
    const func = current ? current.bind(target) : noop;
    enhanced = enhanceFunction(func as any);
    target[methodName] = enhanced as MethodOf<T, K>;
  }
  enhanced.add(extend);
  return () => {
    if (enhanced) {
      enhanced.remove(extend);
      if (enhanced.enhancers.length === 0) {
        target[methodName] = enhanced.__original;
      }
    }
  };
}
