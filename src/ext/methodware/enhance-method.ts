import { Funcware } from "../../function-types";
import { createDisposer } from "../setup";
import { enhanceFunction } from "./enhance-function";
import { MethodOf } from "./method-utility-types";

const noop = () => {};

type EnhancedFn<T, K extends keyof T> = MethodOf<T, K> & {
  add: (enhancer: Funcware<MethodOf<T, K>>) => void;
  remove: (enhancer: Funcware<MethodOf<T, K>>) => void;
  has: (enhancer: Funcware<MethodOf<T, K>>) => boolean;
  enhancers: Funcware<MethodOf<T, K>>[];
  __original: MethodOf<T, K>;
};

export function enhanceMethod<T, K extends keyof T>(
  target: T,
  methodName: K,
  extend: Funcware<MethodOf<T, K>>
) {
  let current = target[methodName] as EnhancedFn<T, K>;
  let teardowns = [] as (() => void)[];
  let enhanced: EnhancedFn<T, K>;
  if (typeof current === "function" && typeof current.add === "function") {
    enhanced = current;
  } else {
    enhanced = enhanceFunction<T, K>(current ?? (noop as MethodOf<T, K>));
    target[methodName] = enhanced as any;
    teardowns.push(() => {
      target[methodName] = current;
    });
  }
  enhanced.add(extend);
  teardowns.push(() => { enhanced.remove(extend); });
  return createDisposer(teardowns)
}

