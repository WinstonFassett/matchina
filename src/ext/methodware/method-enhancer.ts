import { Disposer, Funcware } from "../../function-types";
import { enhanceMethod } from "./enhance-method";
import { MethodOf, HasMethod } from "./method-utility-types";

type MethodEnhancer<K extends string, T extends HasMethod<K>> = (target: T) => Disposer;

/**
 * Creates a MethodEnhancer for a method on a target object.
 *
 * Usage:
 * 1. Call with the method name to match (string key).
 * 2. Call with a Funcware to wrap/enhance the method.
 * 3. Call the resulting enhancer with your target object.
 *
 * Returns an unenhance function to restore the original method.
 *
 * @see MethodEnhancer - type for the enhancer function returned.
 * @see Funcware - type for the middleware function. Funcware<F> is a higher-order function:
 *   (...args) => (fn) => F
 *   It lets you wrap or modify the original method logic.
 *
 * Example:
 *   const enhancer = methodEnhancer('foo')(fn => (...args) => {
 *     console.log('before', args);
 *     const r = fn(...args);
 *     console.log('after', r);
 *     return r;
 *   });
 *   const unenhance = enhancer(target);
 *   target.foo('will', 'be', 'enhanced');
 *   unenhance();
 *   target.foo('will', 'NOT be', 'enhanced');
 */
export const createMethodEnhancer =
  <K extends string>(methodName: K) =>
  <T extends HasMethod<K>>(fn: Funcware<MethodOf<T, K>>): MethodEnhancer<K, T> =>
  (target: T) => {
    return enhanceMethod(target, methodName, fn);
  };
