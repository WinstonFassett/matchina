import { Funcware } from "../../function-types";
import { MethodOf } from "./method-utility-types";

const noop = () => {};

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
export function enhanceMethod<T, K extends keyof T>(
  target: T,
  methodName: K,
  extend: Funcware<MethodOf<T, K>>
) {
  type Enhancer = Funcware<MethodOf<T, K>>;
  type EnhancedFn = MethodOf<T, K> & { __enhancers?: Enhancer[]; __original?: MethodOf<T, K> };

  let current = target[methodName] as EnhancedFn;
  let enhancers: Enhancer[];
  let original: MethodOf<T, K>;

  if (typeof current === "function" && Array.isArray(current.__enhancers)) {
    enhancers = current.__enhancers;
    original = current.__original!;
  } else {
    enhancers = [];
    original = current ?? (noop as MethodOf<T, K>);
    const enhanced: EnhancedFn = function(this: any, ...args: any[]) {
      let fn = (original.bind(this) as MethodOf<T, K>);
      for (const enhancer of enhancers) {
        fn = enhancer(fn) as MethodOf<T, K>;
      }
      return fn(...args);
    } as EnhancedFn;
    enhanced.__enhancers = enhancers;
    enhanced.__original = original;
    target[methodName] = enhanced as any;
    current = enhanced;
  }

  enhancers.push(extend);

  // Return disposer that only removes this enhancer
  return () => {
    const idx = enhancers.indexOf(extend);
    if (idx !== -1) enhancers.splice(idx, 1);
    // If no enhancers left, restore original
    if (enhancers.length === 0) {
      target[methodName] = original;
    }
  };
}

