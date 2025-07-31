import { createMethodEnhancer } from "./ext";

/**
 * Creates a method enhancer for the `execute` method of a promise machine, adding guard logic.
 * The returned enhancer wraps the original method, checks the guard function, and throws if the guard fails.
 * When applied, the enhancer returns a disposer function to undo the enhancement.
 *
 * @param guardFn - Function that checks whether execution should proceed, based on the arguments.
 * @returns A method enhancer for `execute`, which returns a disposer when applied.
 *
 * @example
 * ```ts
 * // Enhance the machine's execute method with a guard
 * const stopGuarding = guardExecute((...args) => args.length > 0)(machine);
 * // Call stopGuarding() to remove the enhancement
 * ```
 * @source This function is a utility for enhancing promise machines with guard logic, ensuring that certain conditions are met before executing the method.
 * It creates a method enhancer with a a typed guard that can be applied to a promise machine's `execute` method.
 * It is useful for ensuring that certain conditions are met before executing the method, enhancing type safety
 */
export function guardExecute<F extends (...args: any[]) => any>(
  guardFn: (...args: Parameters<F>) => boolean
) {
  return createMethodEnhancer("execute")((fn) => (...args) => {
    if (!guardFn(...(args as any))) {
      throw new Error("Guard condition failed");
    }
    return fn(...args);
  });
}
