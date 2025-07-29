import { Disposer, Funcware } from "../../function-types";
import { enhanceMethod } from "./enhance-method";
import { MethodOf, HasMethod } from "./method-utility-types";

/**
 * MethodEnhancer is a function that applies a Funcware enhancer to a method on a target object.
 *
 * Created by {@link createMethodEnhancer} or {@link methodEnhancer}.
 *
 * Call with a target object to enhance its method, and receive a disposer to restore the original method.
 *
 * See {@link Funcware} for details on the enhancer function type.
 */
export type MethodEnhancer<K extends string, T extends HasMethod<K>> = (target: T) => Disposer;

/**
 * {@link methodEnhancer} is an alias for {@link createMethodEnhancer}.
 *
 * See {@link Funcware} for the enhancer function type used to enhance methods.
 * See {@link createMethodEnhancer} for usage details and examples.
 */

/**
 * Creates a MethodEnhancer for a method on a target object.
 *
 * Usage:
 * 1. Call with the method name to match (string key).
 * 2. Call with a {@link Funcware} to wrap/enhance the method.
 * 3. Call the resulting enhancer with your target object.
 *
 * Returns an unenhance function to restore the original method.
 *
 * See {@link MethodEnhancer} for the enhancer function type returned.
 * See {@link Funcware} for the enhancer function type. Funcware<F> is a higher-order function:
 * (...args) => (fn) => F. It lets you wrap or modify the original method logic.
 *
 * @example
 * ```typescript
 * const enhancer = createMethodEnhancer('foo')(fn => (...args) => {
 *   console.log('before', args);
 *   const r = fn(...args);
 *   console.log('after', r);
 *   return r;
 * });
 * const unenhance = enhancer(target);
 * target.foo('will', 'be', 'enhanced');
 * unenhance();
 * target.foo('will', 'NOT be', 'enhanced');
 * ```
 * @source This function is useful for dynamically enhancing methods on objects,
 * such as adding logging, instrumentation, or custom behavior. It is commonly used in middleware,
 * plugin, or extension systems where you want to intercept method calls and restore the original
 * implementation when no longer needed.
 */
export const createMethodEnhancer =
  <K extends string>(methodName: K) =>
  <T extends HasMethod<K>>(fn: Funcware<MethodOf<T, K>>): MethodEnhancer<K, T> =>
  (target: T) => {
    return enhanceMethod(target, methodName, fn);
  };
