import { Func, Funcware } from "../../function-types";

function composeFuncware<F extends Func>(
  original: F,
  funcwares: Array<Funcware<F>>
): F {
  for (const fw of funcwares) {
    original = fw(original);
  }
  return original as F;
}

const EnhancedSymbol = Symbol("enhancedFunction");
export const isEnhancedFunction = <F extends Func>(
  fn: F
): fn is EnhancedFunc<F> => {
  return typeof fn === "function" && EnhancedSymbol in fn;
};

/**
 * Represents an enhanced function with additional capabilities.
 * It includes methods to add, remove, and check for enhancers,
 * as well as a reference to the original function.
 * @see {@link enhanceFunction}, {@link enhanceMethod} and {@link createMethodEnhancer} for creating enhanced functions.
 * @see {@link isEnhancedFunction} for checking if a function is enhanced.
 * 
 */
export type EnhancedFunc<F extends Func> = F & FuncEnhancer<F>;

export interface FuncEnhancer<F extends Func>
{
  add: (...enhancer: Funcware<F>[]) => void;
  remove: (...enhancer: Funcware<F>[]) => void;
  has: (...enhancer: Funcware<F>[]) => boolean;
  enhancers: Funcware<F>[];
  __original: F;
  [EnhancedSymbol]: true;
}
/**
 * Extends a method on a single target using funcware, allowing you to intercept and augment
 * the method's behavior. The funcware receives the original method and its parameters, and can
 * return a new value or modify the call.
 * 
 * Usage:
 * ```ts
 * const disposer = enhanceMethod(obj, 'greet', (next) => (name) => {
 *   console.log('Calling greet with', name);
 *   return next(name);
 * });
 * ```
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
 * 
 * This function is useful for dynamically extending or wrapping methods on objects,
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
export function enhanceFunction<F extends Func>(original: F) {
  type Enhancer = Funcware<F>;
  const enhancers: Enhancer[] = [];
  let composed: F = original;

  function updateComposed() {
    composed = composeFuncware(original, enhancers);
  }

  const enhanced = function (this: any, ...args: any[]) {
    return composed.apply(this, args);
  } as F & {
    add: (...toAdd: Enhancer[]) => void;
    remove: (...toRemove: Enhancer[]) => void;
    has: (...toCheck: Enhancer[]) => boolean;
    enhancers: Enhancer[];
    __original: F;
    [EnhancedSymbol]: true;
  };

  return Object.assign(enhanced, {
    add: (...toAdd: Enhancer[]) => {
      enhancers.push(...toAdd);
      updateComposed();
    },
    remove: (...toRemove: Enhancer[]) => {
      for (const enhancer of toRemove) {
        const idx = enhancers.indexOf(enhancer);
        if (idx !== -1) {
          enhancers.splice(idx, 1);
        }
      }
      updateComposed();
    },
    has: (...toCheck: Enhancer[]) =>
      toCheck.every((e) => enhancers.includes(e)),
    enhancers,
    __original: original,
    [EnhancedSymbol]: true,
  }) as EnhancedFunc<F>;
}
