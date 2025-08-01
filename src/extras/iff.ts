/**
 * Handler function type for events.
 * @template E - The event type.
 */
export type Handler<E> = (event: E) => any;

/**
 * Returns a function that calls the handler only if the test passes for the event.
 *
 * @template E - The event type.
 * @param test - Predicate function to determine if the handler should be called.
 * @param fn - Handler function to call if test returns true.
 * @returns A function that conditionally calls the handler based on the test result.
 */
export function iff<E>(test: (ev: E) => boolean, fn: Handler<E>) {
  return (ev: E) => {
    if (test(ev)) {
      return fn(ev);
    }
  };
}
