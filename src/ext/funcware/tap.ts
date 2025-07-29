import { HasMethod, MethodOf } from "../methodware/method-utility-types";
import { Funcware } from "../../function-types";

/**
 * Creates funcware that taps into a method call, running a side-effect function after the original method.
 *
 * Use cases:
 * - Logging, analytics, or debugging after method execution
 * - Triggering side effects without altering the original return value
 * - Composing additional behavior in functional pipelines
 *
 * @template K - The method name
 * @template T - The target type with the method
 * @param fn - The function to run after the original method
 * @returns Funcware that runs the side-effect function after the original method
 * @source This function is useful for scenarios where you want to observe or react to method calls
 * without changing their result, such as for logging, metrics, or triggering external effects.
 *
 * @example
 * ```ts
 * const logParams = (...params: any[]) => console.log('Called with:', ...params);
 * const tapware = tap(logParams);
 * const original = (x: number) => x * 2;
 * const tapped = tapware(original);
 * tapped(5); // Logs 'Called with: 5', returns 10
 * ```
 */
export const tap =
  <K extends string, T extends HasMethod<K>>(
    fn: T[K]
  ): Funcware<MethodOf<HasMethod<K>, K>> =>
  (inner) =>
  (...params) => {
    const res = inner(...params);
    fn(...params);
    return res;
  };
