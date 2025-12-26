import type { Func, Funcware } from "../../function-types";
import { AbortableEventHandler } from "../abortable-event-handler";

/**
 * Creates funcware that makes an event handler abortable via an AbortableEventHandler.
 *
 * Use cases:
 * - Adding abort logic to event handlers or state machine transitions
 * - Preventing further processing if an abort condition is met
 *
 * @template E - The event type
 * @param handler - An AbortableEventHandler that can signal abort
 * @returns Funcware that wraps an event handler, aborting if signaled
 * @source This function is useful for scenarios where you want to conditionally prevent further
 * processing of an event, such as in middleware, guards, or cancellation logic. It integrates
 * abortable event handling into funcware-based systems for composable control flow.
 *
 * @example
 * ```ts
 * // Example abortable event handler that aborts if event.cancel is true
 * const abortIfCancelled = (ev, abort) => { if (ev.cancel) abort(); };
 * const handler = (ev) => console.log('Handled:', ev);
 * const abortableHandler = abortable(abortIfCancelled)(handler);
 * abortableHandler({ cancel: true }); // Does not log
 * abortableHandler({ cancel: false }); // Logs 'Handled: ...'
 * ```
 */
export const abortable =
  <E>(handler: AbortableEventHandler<E>): Funcware<Func<[E], any>> =>
  (inner: Func<[E], any>) =>
  (ev: E) => {
    let aborted = false;
    handler(ev, () => {
      aborted = true;
    });
    if (!aborted) {
      return inner(ev);
    }
  };
