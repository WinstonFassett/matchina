import { AbortableEventHandler } from "../types";

export function composeAbortables<E>(
  abortables: AbortableEventHandler<E>[],
): AbortableEventHandler<E> {
  return (event, abort) => {
    let aborted = false;
    for (const listener of abortables) {
      listener(event, () => {
        aborted = true;
      });
      if (aborted) {
        break;
      }
    }
    if (aborted) {
      abort();
    }
  };
}
