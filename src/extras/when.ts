import { EntryListener } from "./entry-exit-types";

/**
 * Creates a conditional entry/exit listener for an event.
 *
 * When the test function returns true for an event, the entryListener is called and may return an exitListener.
 * The exitListener (if returned) will be called on the next event before re-evaluating the test.
 *
 * @template E - The event type.
 * @param test - Function to test whether to trigger the entryListener.
 * @param entryListener - Function called when test passes; may return an exitListener.
 * @returns A function to handle events, managing entry and exit listeners based on the test.
 * @example
 * ```ts
 * const teardown = setup(machine)(
 *   whenFromState("Idle", fn),
 *   whenState("Active", fn),
 *   whenEventType("activate", fn)
 * );
 * // Call teardown() to remove listeners
 * ```
 * @source Useful for composing conditional event listeners for state machines, enabling modular setup and teardown logic.
 */
export function when<E>(test: (ev: E) => any, entryListener: EntryListener<E>) {
  let exitListener: void | ((ev: E) => void);
  return (ev: E) => {
    if (exitListener) {
      exitListener(ev);
      exitListener = undefined;
    }
    if (test(ev)) {
      exitListener = entryListener(ev);
    }
  };
}
