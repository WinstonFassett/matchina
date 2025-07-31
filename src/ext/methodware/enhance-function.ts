import { Funcware } from "../../function-types";
import { MethodOf } from "./method-utility-types";

/**
 * Extends a method on a single target using funcware, allowing you to intercept and augment
 * the method's behavior. The funcware receives the original method and its parameters, and can
 * return a new value or modify the call.
 *
 * This function does not return the enhanced method itself. Instead, it replaces the method on
 * the target object and returns a disposer function that restores whatever was there before.
 *
 * Type parameters `T` and `K` are usually inferred automatically and rarely need to be specified.
 *
 * @template T - The target object type
 * @template K - The key of the method to enhance
 * @param target - The object containing the method to enhance
 * @param methodName - The name of the method to enhance
 * @param extend - Funcware (enhancer) that receives the original method and params
 * @returns A disposer function that restores the previous method when called
 * @source This function is useful for dynamically extending or wrapping methods on objects,
 * such as adding logging, instrumentation, or custom behavior. It is commonly used in middleware,
 * plugin, or extension systems where you want to intercept method calls and restore the original
 * implementation when no longer needed.
 *
 * @example
 * ```ts
 * // Example: Enhance a method to log calls
 * const obj = { greet(name) { return `Hello, ${name}`; } };
 * const disposer = enhanceMethod(obj, 'greet', (next) => (name) => {
 *   console.log('Calling greet with', name);
 *   return next(name);
 * });
 * obj.greet('World'); // Logs and returns 'Hello, World'
 * disposer(); // Restores original method
 * ```
 */
export function enhanceFunction<T, K extends keyof T>(
  original: MethodOf<T, K>) {
  type Enhancer = Funcware<MethodOf<T, K>>;
  let enhancers: Enhancer[] = [];

  const enhanced = function (this: any, ...args: any[]) {
    let fn = (original.bind(this) as MethodOf<T, K>);
    for (const enhancer of enhancers) {
      fn = enhancer(fn) as MethodOf<T, K>;
    }
    return fn(...args);
  } as MethodOf<T, K> & {
    add: (enhancer: Enhancer) => void;
    remove: (enhancer: Enhancer) => void;
    has: (enhancer: Enhancer) => boolean;
    enhancers: Enhancer[];
    __original: MethodOf<T, K>;
  };

  enhanced.add = (enhancer: Enhancer) => {
    enhancers.push(enhancer);
  };
  enhanced.remove = (enhancer: Enhancer) => {
    const idx = enhancers.indexOf(enhancer);
    if (idx !== -1) enhancers.splice(idx, 1);
  };
  enhanced.has = (enhancer: Enhancer) => enhancers.includes(enhancer);
  enhanced.enhancers = enhancers;
  enhanced.__original = original;

  return enhanced;
}
