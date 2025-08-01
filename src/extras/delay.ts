/**
 * Returns a promise that resolves after a specified delay in milliseconds.
 *
 * Use cases:
 * - General purpose delay in async workflows
 * - Pausing execution for a set time
 * - Useful for throttling, debouncing, or waiting for resources
 *
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Returns a promise that resolves with the given result after a delay.
 *
 * Use cases:
 * - Simulating asynchronous operations in tests
 * - Creating time-based effects in applications
 * - Returning a value after a delay without blocking the main thread
 *
 * @template T - The type of the result
 * @param ms - Milliseconds to delay
 * @param result - Value to resolve after the delay
 * @returns Promise that resolves with the result after the delay
 * @example
 * ```ts
 * await delayed(1000, 'done'); // Resolves with 'done' after 1 second
 * ```
 */
export const delayed = async <T>(ms: number, result: T) => {
  await delay(ms);
  return result;
};

/**
 * Returns an async function that resolves with the given result after a delay.
 *
 * Use cases:
 * - Creating delayed actions for async workflows
 * - Defining reusable delayed tasks or effects
 * - Useful for composing with other async functions or event handlers
 *
 * @template T - The type of the result
 * @param ms - Milliseconds to delay
 * @param result - Value to resolve after the delay
 * @returns Async function that resolves with the result after the delay
 * @example
 * ```ts
 * const delayedHello = delayer(500, 'hello');
 * await delayedHello(); // Resolves with 'hello' after 500ms
 * ```
 */
export const delayer =
  <T>(ms: number, result: T) =>
  async () => {
    return await delayed(ms, result);
  };
