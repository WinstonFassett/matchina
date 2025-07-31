import { Funcware } from "../../function-types";
import { MethodOf } from "./method-utility-types";

function composeFuncware<T extends (...args: any[]) => any>(
  original: T,
  funcwares: Array<Funcware<T>>
): T {
  // Use reduce for left-to-right composition
  return funcwares.reduce((next, fw) => fw(next), original);
}

export const EnhancedSymbol = Symbol("enhancedFunction");

export const isEnhancedFunction = <T, K extends keyof T>(
  fn: MethodOf<T, K>
): fn is EnhancedFn<T, K> extends true ? EnhancedFn<T, K> : never => {
  return typeof fn === "function" && EnhancedSymbol in fn;
};

export type EnhancedFn<T, K extends keyof T> = MethodOf<T, K> & {
  add: (enhancer: Funcware<MethodOf<T, K>>) => void;
  remove: (enhancer: Funcware<MethodOf<T, K>>) => void;
  has: (enhancer: Funcware<MethodOf<T, K>>) => boolean;
  enhancers: Funcware<MethodOf<T, K>>[];
  __original: MethodOf<T, K>;
  [EnhancedSymbol]: true;
};

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
export function enhanceFunction<T, K extends keyof T>(original: MethodOf<T, K>) {
  type Enhancer = Funcware<MethodOf<T, K>>;
  let enhancers: Enhancer[] = [];
  let composed: MethodOf<T, K> = original;

  function updateComposed() {
    composed = composeFuncware(original, enhancers);
  }

  // The composed function always uses the current enhancer array
  const enhanced = function (this: any, ...args: any[]) {
    return composed.apply(this, args);
  } as MethodOf<T, K> &  EnhancedFn<T, K>;
  return Object.assign(enhanced, {
    add: (...toAdd: Enhancer[]) => {
      enhancers.push(...toAdd);
      updateComposed();
    },
    remove: (...toRemove: Enhancer[]) => {
      for (const enhancer of toRemove) {
        const idx = enhancers.indexOf(enhancer);
        if (idx !== -1) enhancers.splice(idx, 1);
      }
      updateComposed();
    },
    has: (...toCheck: Enhancer[]) => toCheck.every(e => enhancers.includes(e)),
    enhancers,
    __original: original,
    [EnhancedSymbol]: true,
  }) as EnhancedFn<T, K>;
}