import { Funcware } from "../../function-types";
import { createDisposer } from "../setup";
import { EnhancedFn, enhanceFunction, isEnhancedFunction } from "./enhance-function";
import { MethodOf } from "./method-utility-types";

const noop = () => {};



export function enhanceMethod<T, K extends keyof T>(
  target: T,
  methodName: K,
  extend: Funcware<MethodOf<T, K>>
) {
  let current = target[methodName] as MethodOf<T, K>;
  let enhanced: EnhancedFn<T, K> | undefined;
  if (isEnhancedFunction(current)) {
    enhanced = current;
  } else {
    enhanced = enhanceFunction(current ?? (noop as MethodOf<T, K>));
    target[methodName] = enhanced;
  } 
  enhanced.add(extend);  
  return () => {    
    if (enhanced) {
      enhanced.remove(extend);
      if (enhanced.enhancers.length === 0) {
        target[methodName] = enhanced.__original;
      }
    }
  }
}

